import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Users, LayoutGrid } from "lucide-react";
import { floorsApi, tablesApi } from "../../api/floors.api";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Modal } from "../../components/common/Modal";
import { Card } from "../../components/common/Card";

function TableShapeIcon({ shape, className = "" }) {
  if (shape === "round") {
    return <div className={`w-8 h-8 rounded-full border-2 border-brand-espresso bg-bg-sunken flex items-center justify-center ${className}`} title="Round table" />;
  }
  if (shape === "rectangle") {
    return <div className={`w-12 h-8 rounded-md border-2 border-brand-espresso bg-bg-sunken flex items-center justify-center ${className}`} title="Rectangle table" />;
  }
  return <div className={`w-8 h-8 rounded-md border-2 border-brand-espresso bg-bg-sunken flex items-center justify-center ${className}`} title="Square table" />;
}

export default function FloorsTablesPage() {
  const queryClient = useQueryClient();
  const [floorName, setFloorName] = useState("");
  const [floorModal, setFloorModal] = useState(false);
  const [tableModal, setTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [tableForm, setTableForm] = useState({
    floorId: "",
    tableNumber: "",
    seats: "4",
    shape: "square"
  });

  const { data: floors, isLoading } = useQuery({
    queryKey: ["floors"],
    queryFn: floorsApi.list,
  });

  useEffect(() => {
    if (floors && floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  const addFloor = useMutation({
    mutationFn: () => floorsApi.create({ name: floorName }),
    onSuccess: (newFloor) => {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      setFloorName("");
      setFloorModal(false);
      // Auto select the new floor in the table form if the table modal is open
      if (tableModal) {
        setTableForm((prev) => ({ ...prev, floorId: newFloor.id }));
      } else {
        setSelectedFloorId(newFloor.id);
      }
      toast.success("Floor added successfully");
    },
    onError: (err) => toast.error(err.userMessage || "Failed to add floor"),
  });

  const saveTable = useMutation({
    mutationFn: () => {
      const payload = {
        floorId: tableForm.floorId,
        tableNumber: tableForm.tableNumber,
        seats: Number(tableForm.seats),
        shape: tableForm.shape,
      };
      if (editingTable) {
        return tablesApi.update(editingTable.id, payload);
      } else {
        return tablesApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      setTableModal(false);
      setEditingTable(null);
      toast.success(editingTable ? "Table updated" : "Table added");
    },
    onError: (err) => toast.error(err.userMessage || "Failed to save table"),
  });

  const deleteTableMutation = useMutation({
    mutationFn: (id) => tablesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      toast.success("Table deleted");
    },
    onError: (err) => toast.error(err.userMessage || "Failed to delete table"),
  });

  const toggleTableActive = useMutation({
    mutationFn: ({ id, isActive }) => tablesApi.toggleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      toast.success("Table status updated");
    },
    onError: (err) => toast.error(err.userMessage || "Failed to update table status"),
  });

  if (isLoading) return <AdminLayout title="Floors & tables"><div className="p-8 text-center text-text-muted">Loading floors and tables...</div></AdminLayout>;

  const currentFloor = floors?.find((f) => f.id === selectedFloorId);
  const currentTables = currentFloor?.tables || [];

  return (
    <AdminLayout
      title="Floors & tables"
    >
      {/* Floor selector tabs */}
      {floors && floors.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border-subtle pb-px">
          {floors.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFloorId(f.id)}
              className={`px-5 py-3 font-display text-lg rounded-t-xl transition-all border-b-2 -mb-px ${
                selectedFloorId === f.id
                  ? "border-accent-primary text-accent-primary font-bold bg-bg-elevated"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {f.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFloorModal(true)}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-bg-sunken hover:bg-bg-elevated border border-dashed border-border-subtle flex items-center gap-1 ml-2 mb-2 text-accent-primary cursor-pointer transition-all hover:border-accent-primary/60 hover:bg-accent-primary/5"
          >
            <Plus size={16} /> Add Floor
          </button>
        </div>
      ) : (
        <div className="mb-8 p-6 rounded-2xl bg-bg-sunken/30 text-center text-text-muted">
          No floors created yet. <span className="text-accent-primary font-bold cursor-pointer hover:underline" onClick={() => setFloorModal(true)}>Add a Floor</span> to get started.
        </div>
      )}

      {/* Tables Grid */}
      {selectedFloorId && (
        <div className="space-y-6">
          <h2 className="text-xl font-display text-brand-espresso mb-4">
            Tables on {currentFloor?.name}
          </h2>
          {currentTables.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {currentTables.map((t) => (
                <Card key={t.id} className="relative flex flex-col justify-between p-5 border border-border-subtle bg-bg-elevated hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-display text-2xl text-brand-espresso">#{t.table_number}</span>
                      <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                        <Users size={12} /> {t.seats} seats
                      </p>
                    </div>
                    <TableShapeIcon shape={t.shape} />
                  </div>

                  <div className="mt-8 flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.is_active}
                        onChange={() => toggleTableActive.mutate({ id: t.id, isActive: !t.is_active })}
                        className="rounded border-border-subtle text-accent-primary focus:ring-accent-primary w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-text-secondary">Active</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-bg-sunken text-text-primary hover:bg-border-subtle transition-colors"
                        onClick={() => {
                          setEditingTable(t);
                          setTableForm({
                            floorId: t.floor_id,
                            tableNumber: t.table_number,
                            seats: String(t.seats),
                            shape: t.shape || "square",
                          });
                          setTableModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-accent-danger/10 text-accent-danger hover:bg-accent-danger hover:text-white transition-colors"
                        onClick={() => {
                          if (window.confirm(`Delete table #${t.table_number}?`)) {
                            deleteTableMutation.mutate(t.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
              {/* Add Table Card */}
              <button
                type="button"
                onClick={() => {
                  setEditingTable(null);
                  setTableForm({
                    floorId: selectedFloorId,
                    tableNumber: "",
                    seats: "4",
                    shape: "square"
                  });
                  setTableModal(true);
                }}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-border-subtle hover:border-accent-primary/60 hover:bg-accent-primary/5 transition-all text-text-muted hover:text-accent-primary min-h-[140px] cursor-pointer bg-bg-elevated"
              >
                <Plus size={24} />
                <span className="mt-2 text-sm font-semibold">Add Table</span>
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-bg-sunken/20 border border-dashed border-border-subtle text-center text-text-muted">
              No tables on this floor yet. <span className="text-accent-primary font-bold cursor-pointer hover:underline" onClick={() => {
                setEditingTable(null);
                setTableForm({
                  floorId: selectedFloorId,
                  tableNumber: "",
                  seats: "4",
                  shape: "square"
                });
                setTableModal(true);
              }}>Add a Table</span> to create one.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Table Modal */}
      <Modal open={tableModal} onClose={() => { setTableModal(false); setEditingTable(null); }} title={editingTable ? "Edit table" : "Add table"}>
        <div className="space-y-5">
          <Select
            label="Floor"
            value={tableForm.floorId}
            onChange={(e) => {
              if (e.target.value === "NEW_FLOOR") {
                setFloorModal(true);
              } else {
                setTableForm({ ...tableForm, floorId: e.target.value });
              }
            }}
          >
            <option value="">Select floor</option>
            {floors?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            <option value="NEW_FLOOR" className="text-accent-primary font-bold">+ Create New Floor...</option>
          </Select>

          <Input
            label="Table number"
            value={tableForm.tableNumber}
            onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
            placeholder="e.g. 5A"
          />

          <Input
            label="Seats"
            type="number"
            min="1"
            value={tableForm.seats}
            onChange={(e) => setTableForm({ ...tableForm, seats: e.target.value })}
          />

          {/* Visual Shape Picker */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-text-secondary block">Table Shape</span>
            <div className="flex gap-4">
              {["square", "rectangle", "round"].map((sh) => (
                <button
                  key={sh}
                  type="button"
                  onClick={() => setTableForm({ ...tableForm, shape: sh })}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-capitalize transition-colors cursor-pointer ${
                    tableForm.shape === sh
                      ? "border-accent-primary bg-accent-primary/10 text-accent-primary font-bold"
                      : "border-border-subtle hover:border-text-muted text-text-secondary"
                  }`}
                >
                  <TableShapeIcon shape={sh} className={tableForm.shape === sh ? "border-accent-primary" : "border-brand-espresso"} />
                  <span className="text-xs uppercase font-medium tracking-wider">{sh}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button className="mt-8 w-full" onClick={() => saveTable.mutate()} loading={saveTable.isPending}>
          {editingTable ? "Save Changes" : "Create Table"}
        </Button>
      </Modal>

      {/* Add Floor Modal */}
      <Modal open={floorModal} onClose={() => setFloorModal(false)} title="Add floor">
        <div className="space-y-4">
          <Input
            label="Floor name"
            placeholder="e.g. Rooftop"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
          />
        </div>
        <Button className="mt-6 w-full" onClick={() => addFloor.mutate()} loading={addFloor.isPending} disabled={!floorName}>
          Add Floor
        </Button>
      </Modal>
    </AdminLayout>
  );
}
