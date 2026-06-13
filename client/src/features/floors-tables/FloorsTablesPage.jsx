import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { floorsApi, tablesApi } from "../../api/floors.api";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Modal } from "../../components/common/Modal";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { PageToolbar } from "../../components/common/SearchInput";
import { PageSkeleton } from "../../components/common/Skeletons";

export default function FloorsTablesPage() {
  const queryClient = useQueryClient();
  const [floorName, setFloorName] = useState("");
  const [tableModal, setTableModal] = useState(false);
  const [tableForm, setTableForm] = useState({ floorId: "", tableNumber: "", seats: "4" });

  const { data: floors, isLoading } = useQuery({
    queryKey: ["floors"],
    queryFn: floorsApi.list,
  });

  const addFloor = useMutation({
    mutationFn: () => floorsApi.create({ name: floorName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      setFloorName("");
      toast.success("Floor added");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const addTable = useMutation({
    mutationFn: () =>
      tablesApi.create({
        floorId: tableForm.floorId,
        tableNumber: tableForm.tableNumber,
        seats: Number(tableForm.seats),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      setTableModal(false);
      toast.success("Table added");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  if (isLoading) return <AdminLayout title="Floors & tables"><PageSkeleton /></AdminLayout>;

  return (
    <AdminLayout
      title="Floors & tables"
      actions={<Button variant="secondary" icon={Plus} onClick={() => setTableModal(true)}>Add table</Button>}
    >
      <PageToolbar>
        <Input placeholder="New floor name" value={floorName} onChange={(e) => setFloorName(e.target.value)} className="max-w-xs" />
        <Button onClick={() => addFloor.mutate()} disabled={!floorName}>Add floor</Button>
      </PageToolbar>

      <div className="space-y-6">
        {floors?.map((floor) => (
          <Card key={floor.id}>
            <h3 className="mb-4 font-display text-lg text-brand-espresso">{floor.name}</h3>
            <div className="flex flex-wrap gap-2">
              {(floor.tables || []).map((t) => (
                <Badge key={t.id} variant="neutral">#{t.table_number} · {t.seats} seats</Badge>
              ))}
              {!floor.tables?.length && <p className="text-sm text-text-muted">No tables on this floor</p>}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={tableModal} onClose={() => setTableModal(false)} title="Add table">
        <div className="space-y-4">
          <Select label="Floor" value={tableForm.floorId} onChange={(e) => setTableForm({ ...tableForm, floorId: e.target.value })}>
            <option value="">Select floor</option>
            {floors?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
          <Input label="Table number" value={tableForm.tableNumber} onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })} />
          <Input label="Seats" type="number" value={tableForm.seats} onChange={(e) => setTableForm({ ...tableForm, seats: e.target.value })} />
        </div>
        <Button className="mt-6 w-full" onClick={() => addTable.mutate()} loading={addTable.isPending}>Save</Button>
      </Modal>
    </AdminLayout>
  );
}
