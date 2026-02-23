import { useState, useCallback, useEffect, useRef } from 'react';
import { jobTrackerApi } from '@/lib/plugins-api';

const PAGE_SIZE = 50;

export function useJobApplicationsApi() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const loadApps = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const r = await jobTrackerApi.getApplications({
        page: pageNum,
        limit: PAGE_SIZE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(search && { search }),
      });
      setApps(r.data?.data || []);
      setTotal(r.data?.meta?.total ?? 0);
      setHasMore(r.data?.meta?.hasMore ?? false);
      setPage(r.data?.meta?.page ?? pageNum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadApps(1);
  }, [loadApps]);

  useEffect(() => {
    searchTimeoutRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(searchTimeoutRef.current!);
  }, [searchInput]);

  const goToPage = useCallback((p: number) => {
    loadApps(p);
  }, [loadApps]);

  const handleStatusChange = useCallback((status: string) => {
    setStatusFilter(status);
  }, []);

  return {
    apps,
    loading,
    page,
    total,
    hasMore,
    pageSize: PAGE_SIZE,
    statusFilter,
    searchInput,
    setSearchInput,
    setStatusFilter: handleStatusChange,
    loadApps,
    goToPage,
  };
}
