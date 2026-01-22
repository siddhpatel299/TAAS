import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

// Use a singleton pattern if available, or local instance for now
const prisma = new PrismaClient();

export const flowService = {
    // Active Cron Jobs
    activeJobs: new Map<string, cron.ScheduledTask>(),

    async initScheduler() {
        console.log('Initializing Flow Scheduler...');
        this.activeJobs.forEach(job => job.stop());
        this.activeJobs.clear();

        const scheduledWorkflows = await prisma.workflow.findMany({
            where: { isActive: true, triggerType: 'cron' },
            include: { nodes: true, edges: true }
        });

        for (const workflow of scheduledWorkflows) {
            this.scheduleWorkflow(workflow);
        }
    },

    scheduleWorkflow(workflow: any) {
        if (workflow.triggerType !== 'cron' || !workflow.isActive) return;

        const triggerNode = workflow.nodes.find((n: any) => n.type === 'trigger');
        const cronExpression = triggerNode?.config?.cronExpression || triggerNode?.data?.config?.cronExpression;

        if (cronExpression && cron.validate(cronExpression)) {
            console.log(`Scheduling workflow ${workflow.name} with cron: ${cronExpression}`);
            const job = cron.schedule(cronExpression, () => {
                console.log(`Triggering cron workflow: ${workflow.id}`);
                this.executeWorkflow(workflow, { timestamp: new Date(), type: 'cron' });
            });
            this.activeJobs.set(workflow.id, job);
        }
    },

    stopWorkflowJob(workflowId: string) {
        const job = this.activeJobs.get(workflowId);
        if (job) {
            job.stop();
            this.activeJobs.delete(workflowId);
        }
    },

    // ==================== WORKFLOW CRUD ====================

    async getWorkflows(userId: string) {
        return prisma.workflow.findMany({
            where: { userId },
            include: {
                _count: { select: { runs: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
    },

    async getWorkflow(userId: string, workflowId: string) {
        return prisma.workflow.findFirst({
            where: { id: workflowId, userId },
            include: {
                nodes: true,
                edges: true
            }
        });
    },

    async getWorkflowRuns(userId: string, workflowId: string) {
        // Validate access
        const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
        if (!workflow) throw new Error('Workflow not found');

        return prisma.workflowRun.findMany({
            where: { workflowId },
            orderBy: { startedAt: 'desc' },
            take: 50 // Limit to last 50 runs
        });
    },

    async createWorkflow(userId: string, data: { name: string; description?: string }) {
        const workflow = await prisma.workflow.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
                triggerType: 'MANUAL', // Default
                nodes: {
                    create: []
                },
                edges: {
                    create: []
                }
            },
            include: { nodes: true, edges: true }
        });

        // Try to schedule (unlikely for new manual flow, but nice for completeness)
        if (workflow.triggerType === 'cron') {
            this.scheduleWorkflow(workflow);
        }

        return workflow;
    },

    async updateWorkflow(userId: string, workflowId: string, data: any) {
        const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
        if (!workflow) throw new Error('Workflow not found');

        let updatedWorkflow;

        // If nodes/edges are provided, replace them (simple implementation)
        if (data.nodes || data.edges) {
            // Transaction to replace graph
            updatedWorkflow = await prisma.$transaction(async (tx) => {
                // Update basic info
                await tx.workflow.update({
                    where: { id: workflowId },
                    data: {
                        name: data.name,
                        description: data.description,
                        isActive: data.isActive,
                        triggerType: data.triggerType
                    }
                });

                if (data.nodes) {
                    await tx.workflowNode.deleteMany({ where: { workflowId } });
                    await tx.workflowNode.createMany({
                        data: data.nodes.map((n: any) => ({
                            workflowId,
                            id: n.id,
                            type: n.type,
                            label: n.label,
                            config: n.config,
                            positionX: n.positionX,
                            positionY: n.positionY
                        }))
                    });
                }

                if (data.edges) {
                    await tx.workflowEdge.deleteMany({ where: { workflowId } });
                    await tx.workflowEdge.createMany({
                        data: data.edges.map((e: any) => ({
                            workflowId,
                            id: e.id,
                            sourceId: e.sourceId,
                            targetId: e.targetId
                        }))
                    });
                }

                return tx.workflow.findUnique({
                    where: { id: workflowId },
                    include: { nodes: true, edges: true }
                });
            });
        } else {
            // Simple update
            updatedWorkflow = await prisma.workflow.update({
                where: { id: workflowId },
                data,
                include: { nodes: true, edges: true }
            });
        }

        if (updatedWorkflow) {
            // Refresh schedule for this workflow
            this.stopWorkflowJob(workflowId);
            if (updatedWorkflow.isActive && updatedWorkflow.triggerType === 'cron') {
                this.scheduleWorkflow(updatedWorkflow);
            }
            return updatedWorkflow;
        }

        return workflow; // Should not reach here
    },

    async deleteWorkflow(userId: string, workflowId: string) {
        const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
        if (!workflow) throw new Error('Workflow not found');

        this.stopWorkflowJob(workflowId);
        return prisma.workflow.delete({ where: { id: workflowId } });
    },

    // ==================== EXECUTION ENGINE ====================

    /**
     * The core entry point for automation.
     * When any system event happens (e.g. Nexus Task Created), call this.
     */
    async emitEvent(triggerType: string, payload: any, userId?: string) {
        console.log(`[Flow] Event emitted: ${triggerType}`, payload);

        // Find active workflows matching this trigger
        const whereClause: any = {
            isActive: true,
            triggerType
        };
        if (userId) {
            whereClause.userId = userId;
        }

        const workflows = await prisma.workflow.findMany({
            where: whereClause,
            include: { nodes: true, edges: true }
        });

        console.log(`[Flow] Found ${workflows.length} workflows for trigger ${triggerType}`);

        // Execute each workflow asynchronously
        for (const workflow of workflows) {
            this.executeWorkflow(workflow, payload).catch(err => {
                console.error(`[Flow] Workflow ${workflow.id} failed`, err);
            });
        }
    },

    async executeWorkflow(workflow: any, payload: any) {
        console.log(`[Flow] Executing workflow ${workflow.name} (${workflow.id})`);

        // 1. Create a Run Record
        const run = await prisma.workflowRun.create({
            data: {
                workflowId: workflow.id,
                status: 'running',
                triggerData: payload,
                logs: []
            }
        });

        const logs: string[] = [`Started by trigger: ${workflow.triggerType}`];

        try {
            // 2. Find Trigger Node
            const triggerNode = workflow.nodes.find((n: any) => n.type === 'trigger');
            if (!triggerNode) {
                throw new Error('No trigger node found in workflow');
            }

            // 3. Graph Traversal (BFS)
            const queue = [triggerNode];
            const visited = new Set();

            while (queue.length > 0) {
                const currentNode = queue.shift();
                if (!currentNode || visited.has(currentNode.id)) continue;
                visited.add(currentNode.id);

                logs.push(`Visiting node: ${currentNode.label} (${currentNode.type})`);

                // --- EXECUTE NODE LOGIC HERE ---
                // For now, we simulate execution
                if (currentNode.type === 'action') {
                    logs.push(`> Executing Action: ${JSON.stringify(currentNode.config || currentNode.data?.config)}`);
                    // TODO: Switch based on action type (e.g. SEND_TELEGRAM, CREATE_TASK)
                }
                // -------------------------------

                // Find next nodes
                const outgoingEdges = workflow.edges.filter((e: any) => e.sourceId === currentNode.id);
                for (const edge of outgoingEdges) {
                    const nextNode = workflow.nodes.find((n: any) => n.id === edge.targetId);
                    if (nextNode) queue.push(nextNode);
                }
            }

            // 4. Mark Complete
            await prisma.workflowRun.update({
                where: { id: run.id },
                data: {
                    status: 'success',
                    completedAt: new Date(),
                    logs: logs
                }
            });

        } catch (error: any) {
            logs.push(`ERROR: ${error.message}`);
            await prisma.workflowRun.update({
                where: { id: run.id },
                data: {
                    status: 'failed',
                    completedAt: new Date(),
                    logs: logs
                }
            });
        }
    }
};
