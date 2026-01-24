import { prisma } from '../lib/prisma';
import { CrmContact, CrmInteraction, CrmTag } from '@prisma/client';

export interface CreateContactInput {
    userId: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    position?: string;
    status?: string;
    notes?: string;
    linkedinUrl?: string;
}

export interface UpdateContactInput {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    position?: string;
    status?: string;
    pipelineStage?: string;
    rating?: number;
    isFavorite?: boolean;
    notes?: string;
    tags?: string[];
    linkedinUrl?: string;
}

export interface CreateInteractionInput {
    userId: string;
    type: string;
    summary: string;
    details?: string;
    date?: Date;
    duration?: number;
    direction?: string;
}

export class CrmService {
    /**
     * Get all contacts for a user with filters
     */
    async getContacts(userId: string, filters?: {
        search?: string;
        company?: string;
        status?: string;
        tag?: string;
        isFavorite?: boolean;
        pipelineStage?: string;
        sort?: string;
        order?: 'asc' | 'desc';
        page?: number;
        limit?: number;
    }) {
        const {
            search,
            company,
            status,
            tag,
            isFavorite,
            pipelineStage,
            sort = 'createdAt',
            order = 'desc',
            page = 1,
            limit = 50,
        } = filters || {};

        const where: any = { userId };

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (company) where.company = { contains: company, mode: 'insensitive' };
        if (status) where.status = status;
        if (pipelineStage) where.pipelineStage = pipelineStage;
        if (isFavorite !== undefined) where.isFavorite = isFavorite;

        if (tag) {
            where.tags = {
                some: {
                    tag: {
                        name: tag,
                    },
                },
            };
        }

        const [contacts, total] = await Promise.all([
            prisma.crmContact.findMany({
                where,
                include: {
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
                orderBy: { [sort]: order },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.crmContact.count({ where }),
        ]);

        return {
            data: contacts.map(this.transformContact),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get a single contact by ID
     */
    async getContact(userId: string, contactId: string) {
        const contact = await prisma.crmContact.findUnique({
            where: { id: contactId, userId },
            include: {
                tags: {
                    include: { tag: true },
                },
                interactions: {
                    orderBy: { date: 'desc' },
                    take: 5,
                },
            },
        });

        if (!contact) return null;

        return this.transformContact(contact);
    }

    /**
     * Create a new contact
     */
    async createContact(input: CreateContactInput) {
        return prisma.crmContact.create({
            data: {
                ...input,
                lastContactedAt: new Date(),
            },
        });
    }

    /**
     * Update a contact
     */
    async updateContact(userId: string, contactId: string, input: UpdateContactInput) {
        const { tags, ...data } = input;

        // Handle tag updates if provided
        if (tags) {
            // First clear existing tags
            await prisma.crmTagsOnContacts.deleteMany({
                where: { contactId },
            });

            // Then add new tags (creating them if they don't exist)
            for (const tagName of tags) {
                let tag = await prisma.crmTag.findUnique({
                    where: { userId_name: { userId, name: tagName } },
                });

                if (!tag) {
                    tag = await prisma.crmTag.create({
                        data: { userId, name: tagName, color: this.getRandomColor() },
                    });
                }

                await prisma.crmTagsOnContacts.create({
                    data: {
                        contactId,
                        tagId: tag.id,
                    },
                });
            }
        }

        const contact = await prisma.crmContact.update({
            where: { id: contactId, userId },
            data: data,
            include: {
                tags: { include: { tag: true } },
            },
        });

        return this.transformContact(contact);
    }

    /**
     * Delete a contact
     */
    async deleteContact(userId: string, contactId: string) {
        return prisma.crmContact.delete({
            where: { id: contactId, userId },
        });
    }

    /**
     * Add interaction to a contact
     */
    async addInteraction(userId: string, contactId: string, input: CreateInteractionInput) {
        const interaction = await prisma.crmInteraction.create({
            data: {
                ...input,
                userId,
                contactId,
            },
        });

        // Update last contacted date on contact
        await prisma.crmContact.update({
            where: { id: contactId },
            data: { lastContactedAt: input.date || new Date() },
        });

        return interaction;
    }

    /**
     * Get interactions for a contact
     */
    async getInteractions(userId: string, contactId: string) {
        return prisma.crmInteraction.findMany({
            where: { contactId, userId },
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Get all tags for a user
     */
    async getTags(userId: string) {
        return prisma.crmTag.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Transform contact object to flatter structure for frontend
     */
    private transformContact(contact: any) {
        return {
            ...contact,
            tags: contact.tags?.map((t: any) => t.tag) || [],
        };
    }

    private getRandomColor() {
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

export const crmService = new CrmService();
