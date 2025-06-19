import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataEditor, GridColumn, GridCellKind } from "@glideapps/glide-data-grid";
import { useDataProvider, useNotify } from 'react-admin';
import { useCollapsingGroups } from './useCollapsingGroups';
import "@glideapps/glide-data-grid/dist/index.css";

interface Kind {
  uid: number;
  lh_object_name: string;
  definition?: string;
  [key: string]: any;
}

interface KindsListProps {
  height?: number;
}

const testTheme: Theme = {
    accentColor: "#4F5DFF",
    accentFg: "#FFFFFF",
    accentLight: "rgba(62, 116, 253, 0.1)",

    textDark: "#313139",
    textMedium: "#737383",
    textLight: "#B2B2C0",
    textBubble: "#313139",

    bgIconHeader: "#737383",
    fgIconHeader: "#FFFFFF",
    textHeader: "#313139",
    textGroupHeader: "#313139BB",
    textHeaderSelected: "#FFFFFF",

    bgCell: "#FFFFFF",
    bgCellMedium: "#FAFAFB",
    bgHeader: "#F7F7F8",
    bgHeaderHasFocus: "#E9E9EB",
    bgHeaderHovered: "#EFEFF1",

    bgBubble: "#EDEDF3",
    bgBubbleSelected: "#FFFFFF",

    headerIconSize: 20,
    markerFontStyle: "13px",

    bgSearchResult: "#fff9e3",

    borderColor: "rgba(115, 116, 131, 0.16)",
    horizontalBorderColor: "rgba(115, 116, 131, 0.16)",
    drilldownBorder: "rgba(0, 0, 0, 0)",

    linkColor: "#4F5DFF",

    cellHorizontalPadding: 8,
    cellVerticalPadding: 3,

    headerFontStyle: "600 13px",
    baseFontStyle: "13px",
    editorFontSize: "13px",
    lineHeight: 1.4,
    fontFamily:
        "Inter, Roboto, -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Ubuntu, noto, arial, sans-serif",
};

export const KindsList: React.FC<KindsListProps> = ({ height = 600 }) => {
  const [data, setData] = useState<Kind[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortField, setSortField] = useState('lh_object_name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const columns: GridColumn[] = useMemo(() => [
    {
      title: "UID",
      id: "lh_object_uid",
      width: 80,
      kind: GridCellKind.Number,
      group: 'suckit'
    },
    {
      title: "Name",
      id: "lh_object_name", 
      width: 250,
      kind: GridCellKind.Text,
      group: 'suckit'
    },
    {
      title: "Definition",
      id: "full_definition",
      grow: 1, // Allow this column to grow and fill available space
      kind: GridCellKind.Text,
    }
  ], []);

  const collapseArgs = useCollapsingGroups({
      columns: columns,
      theme: testTheme,
      freezeColumns: 0,
  });

  console.log('!!!!!!!!!!!!!!!!!!!########### Collapse Args:', collapseArgs);

  const loadData = useCallback(async (pageNum: number = page) => {
    setLoading(true);
    try {
      const result = await dataProvider.getList('db/kinds', {
        pagination: { page: pageNum, perPage: pageSize },
        sort: { field: sortField, order: sortOrder },
        filter: {}
      });
      
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load kinds:', error);
      notify('Failed to load kinds data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [dataProvider, page, pageSize, sortField, sortOrder, notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCellContent = useCallback((cell: readonly [number, number]) => {
    const [col, row] = cell;
    const item = data[row];
    
    if (!item) {
      return {
        kind: GridCellKind.Loading,
        allowOverlay: false,
      };
    }

    const column = columns[col];
    const value = item[column.id] || '';

    switch (column.kind) {
      case GridCellKind.Number:
        return {
          kind: GridCellKind.Number,
          data: typeof value === 'number' ? value : parseInt(value) || 0,
          displayData: String(value),
          allowOverlay: false,
        };
      case GridCellKind.Text:
      default:
        return {
          kind: GridCellKind.Text,
          data: String(value),
          displayData: String(value),
          allowOverlay: true,
        };
    }
  }, [data, columns]);

  const onHeaderClicked = useCallback((col: number, event: any) => {
    const column = columns[col];
    if (column.id === sortField) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(column.id);
      setSortOrder('ASC');
    }
    setPage(1); // Reset to first page when sorting changes
  }, [columns, sortField, sortOrder]);

  const totalPages = Math.ceil(total / pageSize);

  const generatePageNumbers = useCallback(() => {
    const pages = [];
    const maxVisible = 7; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      if (page <= 4) {
        // Show: 1, 2, 3, 4, 5, ..., last
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        // Show: 1, ..., last-4, last-3, last-2, last-1, last
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show: 1, ..., current-1, current, current+1, ..., last
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [page, totalPages]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  }, [page, totalPages]);

  return (
    <div style={{ 
      width: '100%', 
      height: `${height}px`,
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div style={{ 
        padding: '8px 16px', 
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
          Kinds ({loading ? '...' : total})
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Sort: {sortField} {sortOrder === 'ASC' ? '↑' : '↓'}
          </span>
          {loading && (
            <span style={{ fontSize: '14px', color: '#666' }}>Loading...</span>
          )}
        </div>
      </div>
      
      <DataEditor
        getCellContent={getCellContent}
        columns={columns}
        rows={data.length}
        width="100%"
        height={height - 110} // Account for header and pagination height
        onHeaderClicked={onHeaderClicked}
        onGroupHeaderClicked={(group, event) => {
          // Handle group header clicks if needed
          console.log('Group header clicked:', group);
        }}
        smoothScrollX={true}
        smoothScrollY={true}
        isDraggable={false}
        rowHeight={50}
        headerHeight={36}
        theme={{
          accentColor: "#1976d2",
          accentLight: "#e3f2fd",
          textDark: "#313139",
          textMedium: "#737383",
          textLight: "#b2b2c0",
          textBubble: "#313139",
          bgIconHeader: "#737383",
          fgIconHeader: "#ffffff",
          textHeader: "#313139",
          textHeaderSelected: "#000000",
          bgCell: "#ffffff",
          bgCellMedium: "#fafafb",
          bgHeader: "#f7f7f8",
          bgHeaderHasFocus: "#e9e9ea",
          bgHeaderHovered: "#efeff1",
          bgBubble: "#212121",
          bgBubbleSelected: "#000000",
          bgSearchResult: "#fff9c4",
          borderColor: "rgba(115, 116, 131, 0.16)",
          drilldownBorder: "rgba(0, 0, 0, 0)",
          linkColor: "#1976d2",
          headerFontStyle: "600 13px",
          baseFontStyle: "13px",
          fontFamily: "Inter, Roboto, -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, noto, arial, sans-serif",
        }}
      />
      
      {/* Pagination */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#fafafa',
        minHeight: '40px'
      }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Page {page} of {totalPages} ({total} total items)
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            style={{
              padding: '6px 8px',
              border: '1px solid #ddd',
              backgroundColor: page === 1 ? '#f5f5f5' : '#fff',
              color: page === 1 ? '#999' : '#333',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            ←
          </button>
          
          {/* Page numbers */}
          {generatePageNumbers().map((pageNum, index) => (
            <button
              key={index}
              onClick={() => typeof pageNum === 'number' ? handlePageChange(pageNum) : undefined}
              disabled={pageNum === '...'}
              style={{
                padding: '6px 10px',
                border: '1px solid #ddd',
                backgroundColor: pageNum === page ? '#1976d2' : pageNum === '...' ? 'transparent' : '#fff',
                color: pageNum === page ? '#fff' : pageNum === '...' ? '#999' : '#333',
                cursor: pageNum === '...' ? 'default' : 'pointer',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '32px'
              }}
            >
              {pageNum}
            </button>
          ))}
          
          {/* Next button */}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            style={{
              padding: '6px 8px',
              border: '1px solid #ddd',
              backgroundColor: page === totalPages ? '#f5f5f5' : '#fff',
              color: page === totalPages ? '#999' : '#333',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default KindsList;
