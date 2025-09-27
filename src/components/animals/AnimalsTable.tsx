import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Animal } from "@/types/animal";
import { getAnimals } from "@/lib/animals";
import { Badge } from "@/components/ui/badge";

export const AnimalsTable = ({ refreshKey }: { refreshKey: number }) => {
  const [query, setQuery] = useState("");

  const animals = useMemo(() => getAnimals(), [refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return animals;
    return animals.filter((a) =>
      [
        a.tagId,
        a.species,
        a.sex,
        a.status,
        a.breed,
        a.location,
        a.damId,
        a.sireId,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [animals, query]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Input
            placeholder="Search by tag, species, status, location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Species</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Birth Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Weight (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a: Animal) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.tagId}</TableCell>
                  <TableCell>{a.species}</TableCell>
                  <TableCell>{a.sex}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "Active" ? "default" : "secondary"}>{a.status}</Badge>
                  </TableCell>
                  <TableCell>{a.breed || "—"}</TableCell>
                  <TableCell>{a.birthDate || "—"}</TableCell>
                  <TableCell>{a.location || "—"}</TableCell>
                  <TableCell>{a.lastWeightKg ?? "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    No animals found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimalsTable;