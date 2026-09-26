"use client";

import { Button } from "@/components/ui/button";
// import { cn } from '@/lib/utils'
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { ApproveUserButton } from "./approve-user-button";
import { Combobox } from "@/components/ui/combobox";

type UserProps = {
  id: string;
  username: string;
  email: string;
  isTeacher?: boolean | null;
  isAdmin: boolean;
  klasse: string | null;
  teacherRequested: boolean;
  nameBlocked: boolean;
  isOwner: boolean;
  awaitingApproval: boolean;
};

type ColumnsProps = {
  handleIsTeacherChange: (userId: string, value: boolean) => void;
  userIsTeacher: { [userId: string]: boolean };
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  /** Teachers may only edit students; admins may edit everyone. */
  viewerIsAdmin: boolean;
  /** Only the owner may delete admins; the owner can't be deleted. */
  viewerIsOwner: boolean;
};

export const columns = ({
  handleIsTeacherChange,
  userIsTeacher,
  onEdit,
  onDelete,
  viewerIsAdmin,
  viewerIsOwner,
}: ColumnsProps): ColumnDef<UserProps>[] => [
  {
    accessorKey: "username",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Username
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="flex flex-wrap items-center gap-2">
        <span
          className={
            row.original.nameBlocked ? "text-destructive font-medium" : ""
          }
        >
          {row.original.username || "—"}
        </span>
        {row.original.awaitingApproval && (
          <span className="rounded-full border border-sky-500/50 bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-800 dark:text-sky-200">
            Wartet auf Freischaltung
          </span>
        )}
        {row.original.nameBlocked && (
          <span className="rounded-full border border-destructive/50 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            Unzulässiger Name
          </span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "isTeacher",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Rolle
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.teacherRequested ? (
        <span className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
          Möchte Lehrkraft werden
        </span>
      ) : (
        <span>{row.original.isTeacher ? "Lehrer" : "Schüler"}</span>
      ),
  },
  {
    accessorKey: "klasse",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Klasse
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.klasse ?? "—"}</span>
    ),
  },
  {
    header: "",
    id: "edit",
    cell: ({ row }) => {
      const isStaff = row.original.isTeacher === true || row.original.isAdmin;
      const allowed = !isStaff || viewerIsAdmin;
      return (
        <span className="flex items-center gap-1">
          {row.original.awaitingApproval && (
            <ApproveUserButton userId={row.original.id} />
          )}
          <Button
            variant={row.original.nameBlocked ? "destructive" : "ghost"}
            size="sm"
            className="gap-1.5"
            disabled={!allowed}
            title={
              allowed
                ? "Name und Klasse bearbeiten"
                : "Nur Admins können Lehrkräfte bearbeiten"
            }
            onClick={() => onEdit(row.original.id)}
          >
            <Pencil className="size-3.5" />
            Bearbeiten
          </Button>
        </span>
      );
    },
  },
  {
    header: "Rolle ändern",
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;
      return (
        <Combobox
          options={[
            { label: "Zum Lehrer ernennen", value: "true" },
            { label: "Zum Schüler ernennen", value: "false" },
          ]}
          value={
            userIsTeacher[id] !== undefined ? userIsTeacher[id].toString() : ""
          }
          onChange={(value) => handleIsTeacherChange(id, value === "true")}
        />
      );
    },
  },
  ...(viewerIsAdmin
    ? [
        {
          header: "",
          id: "delete",
          cell: ({ row }) => {
            const blockedReason = row.original.isOwner
              ? "Der Owner kann nicht gelöscht werden"
              : row.original.isAdmin && !viewerIsOwner
                ? "Nur der Owner kann Admins löschen"
                : null;
            return (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={!!blockedReason}
                title={blockedReason ?? "Nutzer löschen"}
                aria-label="Nutzer löschen"
                onClick={() => onDelete(row.original.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            );
          },
        } satisfies ColumnDef<UserProps>,
      ]
    : []),
];
