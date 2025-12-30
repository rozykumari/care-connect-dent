import React, { memo, CSSProperties, ReactElement } from "react";
import { List, RowComponentProps } from "react-window";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  height?: number;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
}

// Row props for the table
interface TableRowPropsData<T> {
  items: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}

// Table row component
function TableRowComponent<T>({ 
  index, 
  style, 
  items,
  columns,
  onRowClick,
}: RowComponentProps<TableRowPropsData<T>>): ReactElement {
  const item = items[index];

  return (
    <div
      style={style}
      className={cn(
        "flex items-center border-b border-border hover:bg-muted/50 transition-colors",
        onRowClick && "cursor-pointer"
      )}
      onClick={onRowClick ? () => onRowClick(item) : undefined}
    >
      {columns.map((column) => (
        <div 
          key={column.key} 
          className={cn("px-4 py-3 text-sm", column.className)}
          style={{ width: column.width || "auto", flex: column.width ? "none" : 1 }}
        >
          {column.render(item, index)}
        </div>
      ))}
    </div>
  );
}

export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 56,
  height = 400,
  emptyMessage = "No data found",
  keyExtractor,
  onRowClick,
}: VirtualizedTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const calculatedHeight = Math.min(height, data.length * rowHeight);

  return (
    <div className="w-full overflow-hidden rounded-md border border-border">
      {/* Header */}
      <div className="flex bg-muted/50 border-b border-border">
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn("px-4 py-3 text-sm font-medium text-muted-foreground", column.className)}
            style={{ width: column.width || "auto", flex: column.width ? "none" : 1 }}
          >
            {column.header}
          </div>
        ))}
      </div>
      
      {/* Virtualized Body */}
      <List<TableRowPropsData<T>>
        rowComponent={TableRowComponent as (props: RowComponentProps<TableRowPropsData<T>>) => ReactElement}
        rowCount={data.length}
        rowHeight={rowHeight}
        rowProps={{ items: data, columns, onRowClick }}
        style={{ height: calculatedHeight }}
        overscanCount={5}
      />
    </div>
  );
}

// Simple virtualized list for card views
interface VirtualizedListProps<T> {
  data: T[];
  itemHeight: number;
  height?: number;
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

// Row props for simple list
interface ListRowPropsData<T> {
  items: T[];
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
}

function ListRowComponent<T>({
  index,
  style,
  items,
  renderItem,
}: RowComponentProps<ListRowPropsData<T>>): ReactElement {
  const item = items[index];
  return <>{renderItem(item, index, style)}</>;
}

export function VirtualizedList<T>({
  data,
  itemHeight,
  height = 600,
  renderItem,
  emptyMessage = "No data found",
  className,
}: VirtualizedListProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        {emptyMessage}
      </div>
    );
  }

  const calculatedHeight = Math.min(height, data.length * itemHeight);

  return (
    <List<ListRowPropsData<T>>
      rowComponent={ListRowComponent as (props: RowComponentProps<ListRowPropsData<T>>) => ReactElement}
      rowCount={data.length}
      rowHeight={itemHeight}
      rowProps={{ items: data, renderItem }}
      style={{ height: calculatedHeight }}
      overscanCount={3}
      className={className}
    />
  );
}
