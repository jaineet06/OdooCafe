import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { usersApi } from "../../api/config.api";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { ListRow } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import { TableSkeleton } from "../../components/common/Skeletons";
import { Users } from "lucide-react";

export default function UsersAdminPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      toast.success("Employee added");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => usersApi.toggleArchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Updated");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  return (
    <AdminLayout title="Employees" actions={<Button icon={Plus} onClick={() => setOpen(true)}>Add employee</Button>}>
      {isLoading ? (
        <TableSkeleton />
      ) : !users?.length ? (
        <EmptyState icon={Users} title="No employees" description="Add team members who can access the POS." action={<Button onClick={() => setOpen(true)}>Add employee</Button>} />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <ListRow key={u.id}>
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-text-muted">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={u.is_archived ? "neutral" : "success"}>{u.role}</Badge>
                <Button variant="secondary" size="sm" onClick={() => archiveMutation.mutate(u.id)}>
                  {u.is_archived ? "Unarchive" : "Archive"}
                </Button>
              </div>
            </ListRow>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New employee">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <Button className="mt-6 w-full" onClick={() => createMutation.mutate()} loading={createMutation.isPending}>Save</Button>
      </Modal>
    </AdminLayout>
  );
}
