import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { categoriesApi } from "../../api/categories.api";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { ColorInput } from "../../components/common/Toggle";
import { Modal } from "../../components/common/Modal";
import { ListRow } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { TableSkeleton } from "../../components/common/Skeletons";
import { Tags } from "lucide-react";

export default function CategoriesAdminPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#6B7F6B" });
  const [editId, setEditId] = useState(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const saveMutation = useMutation({
    mutationFn: () => (editId ? categoriesApi.update(editId, form) : categoriesApi.create(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Saved");
      setOpen(false);
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Deleted");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", color: "#6B7F6B" });
    setOpen(true);
  };

  return (
    <AdminLayout
      title="Categories"
      actions={<Button icon={Plus} onClick={openCreate}>Add category</Button>}
    >
      {isLoading ? (
        <TableSkeleton />
      ) : !categories?.length ? (
        <EmptyState icon={Tags} title="No categories yet" description="Create categories to organize your menu." action={<Button onClick={openCreate}>Add category</Button>} />
      ) : (
        <div className="space-y-3">
          {categories.map((c) => (
            <ListRow key={c.id} accentColor={c.color}>
              <span className="font-semibold">{c.name}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setEditId(c.id); setForm({ name: c.name, color: c.color }); setOpen(true); }}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(c.id)}>Delete</Button>
              </div>
            </ListRow>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit category" : "New category"}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <ColorInput label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        </div>
        <Button className="mt-6 w-full" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
      </Modal>
    </AdminLayout>
  );
}
