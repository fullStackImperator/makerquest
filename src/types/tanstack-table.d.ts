import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // Keep empty: adding members makes `filterFns` required on every `useReactTable`.
  // Use inline `globalFilterFn` / column `filterFn` callbacks instead of string keys.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface FilterFns {}
}
