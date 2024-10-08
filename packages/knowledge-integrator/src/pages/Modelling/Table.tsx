import React, { useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "ag-grid-community/styles/ag-theme-balham.css"; // Optional Theme applied to the grid

export default function DenseTable({ rows, height = 500 }) {
  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState([
    // { field: "sequence" },
    // { field: "language_uid" },
    // { field: "language" },
    // { field: "lh_context_uid" },
    // { field: "lh_context_name" },
    { field: "lh_object_uid", width: 100 },
    // { field: "lh_cardinalities" },
    { field: "lh_object_name", tooltipField: "lh_object_name" },
    // { field: "fact_uid" },
    { field: "rel_type_uid", width: 100 },
    { field: "rel_type_name", tooltipField: "rel_type_name" },
    { field: "rh_object_uid", width: 100 },
    // { field: "rh_cardinalities" },
    { field: "rh_object_name", tooltipField: "rh_object_name" },
    {
      field: "partial_definition",
      tooltipField: "partial_definition",
    },
    {
      field: "full_definition",
      tooltipField: "full_definition",
    },
    { field: "uom_uid" },
    { field: "uom_name" },
    { field: "remarks" },
    { field: "approval_status" },
    // { field: "successor_uid" },
    { field: "effective_from" },
    { field: "latest_update" },
    { field: "author" },
    { field: "reference" },
    // { field: "collection_uid" },
    // { field: "collection_name" },
    // { field: "validity_context_uid" },
    // { field: "validity_context_name" },
  ]);

  return (
    // wrapping container with theme & size
    <div
      className="ag-theme-balham" // applying the grid theme
      style={{ height: height, fontSize: "0.65em" }} // the grid will fill the size of the parent container
    >
      <AgGridReact
        rowData={rows}
        columnDefs={colDefs}
        tooltipShowDelay={0}
        tooltipMouseTrack={true}
        tooltipHideDelay={20000}
      />
    </div>
  );
}
