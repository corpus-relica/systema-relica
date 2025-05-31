import React from "react";

/**
 * Material-UI mocks for fact-search-ui testing
 * Provides mock implementations of MUI components and utilities
 */

// Mock common MUI components
export const mockMuiComponents = {
  // Layout components
  Box: ({ children, ...props }: any) =>
    React.createElement(
      "div",
      { "data-testid": "mui-box", ...props },
      children
    ),

  Container: ({ children, ...props }: any) =>
    React.createElement(
      "div",
      { "data-testid": "mui-container", ...props },
      children
    ),

  Grid: ({ children, ...props }: any) =>
    React.createElement(
      "div",
      { "data-testid": "mui-grid", ...props },
      children
    ),

  Stack: ({ children, ...props }: any) =>
    React.createElement(
      "div",
      { "data-testid": "mui-stack", ...props },
      children
    ),

  // Typography
  Typography: ({ children, variant, ...props }: any) =>
    React.createElement(
      variant === "h1" ? "h1" : variant === "h2" ? "h2" : "p",
      { "data-testid": "mui-typography", "data-variant": variant, ...props },
      children
    ),

  // Form components
  TextField: ({ label, value, onChange, ...props }: any) =>
    React.createElement("input", {
      "data-testid": "mui-textfield",
      "aria-label": label,
      value,
      onChange: (e: any) => onChange?.(e),
      ...props,
    }),

  Select: ({ children, value, onChange, ...props }: any) =>
    React.createElement(
      "select",
      {
        "data-testid": "mui-select",
        value,
        onChange: (e: any) => onChange?.(e),
        ...props,
      },
      children
    ),

  MenuItem: ({ children, value, ...props }: any) =>
    React.createElement(
      "option",
      {
        "data-testid": "mui-menuitem",
        value,
        ...props,
      },
      children
    ),

  FormControl: ({ children, ...props }: any) =>
    React.createElement(
      "div",
      { "data-testid": "mui-formcontrol", ...props },
      children
    ),

  FormLabel: ({ children, ...props }: any) =>
    React.createElement(
      "label",
      { "data-testid": "mui-formlabel", ...props },
      children
    ),

  InputLabel: ({ children, ...props }: any) =>
    React.createElement(
      "label",
      { "data-testid": "mui-inputlabel", ...props },
      children
    ),

  // Buttons
  Button: ({ children, onClick, variant, color, ...props }: any) =>
    React.createElement(
      "button",
      {
        "data-testid": "mui-button",
        "data-variant": variant,
        "data-color": color,
        onClick,
        ...props,
      },
      children
    ),

  IconButton: ({ children, onClick, ...props }: any) =>
    React.createElement(
      "button",
      {
        "data-testid": "mui-iconbutton",
        onClick,
        ...props,
      },
      children
    ),

  Fab: ({ children, onClick, ...props }: any) =>
    React.createElement(
      "button",
      {
        "data-testid": "mui-fab",
        onClick,
        ...props,
      },
      children
    ),

  // Data display
  Table: ({ children, ...props }: any) =>
    React.createElement(
      "table",
      { "data-testid": "mui-table", ...props },
      children
    ),

  TableHead: ({ children, ...props }: any) =>
    React.createElement(
      "thead",
      { "data-testid": "mui-tablehead", ...props },
      children
    ),

  TableBody: ({ children, ...props }: any) =>
    React.createElement(
      "tbody",
      { "data-testid": "mui-tablebody", ...props },
      children
    ),

  TableRow: ({ children, ...props }: any) =>
    React.createElement(
      "tr",
      { "data-testid": "mui-tablerow", ...props },
      children
    ),

  TableCell: ({ children, ...props }: any) =>
    React.createElement(
      "td",
      { "data-testid": "mui-tablecell", ...props },
      children
    ),

  Chip: ({ label, onDelete, ...props }: any) =>
    React.createElement(
      "span",
      {
        "data-testid": "mui-chip",
        ...props,
      },
      [
        label,
        onDelete &&
          React.createElement(
            "button",
            {
              key: "delete",
              "data-testid": "mui-chip-delete",
              onClick: onDelete,
            },
            "×"
          ),
      ]
    ),

  Avatar: ({ children, src, alt, ...props }: any) =>
    src
      ? React.createElement("img", {
          "data-testid": "mui-avatar",
          src,
          alt,
          ...props,
        })
      : React.createElement(
          "div",
          {
            "data-testid": "mui-avatar",
            ...props,
          },
          children
        ),

  // Feedback
  Alert: ({ children, severity, ...props }: any) =>
    React.createElement(
      "div",
      {
        "data-testid": "mui-alert",
        "data-severity": severity,
        role: "alert",
        ...props,
      },
      children
    ),

  Snackbar: ({ open, message, children, ...props }: any) =>
    open
      ? React.createElement(
          "div",
          {
            "data-testid": "mui-snackbar",
            role: "alert",
            ...props,
          },
          children || message
        )
      : null,

  CircularProgress: ({ ...props }: any) =>
    React.createElement("div", {
      "data-testid": "mui-circularprogress",
      role: "progressbar",
      ...props,
    }),

  LinearProgress: ({ value, ...props }: any) =>
    React.createElement("div", {
      "data-testid": "mui-linearprogress",
      role: "progressbar",
      "aria-valuenow": value,
      ...props,
    }),

  // Navigation
  AppBar: ({ children, ...props }: any) =>
    React.createElement(
      "header",
      { "data-testid": "mui-appbar", ...props },
      children
    ),

  Toolbar: ({ children, ...props }: any) =>
    React.createElement(
      "div",
      { "data-testid": "mui-toolbar", ...props },
      children
    ),

  Drawer: ({ open, children, ...props }: any) =>
    open
      ? React.createElement(
          "aside",
          {
            "data-testid": "mui-drawer",
            ...props,
          },
          children
        )
      : null,

  List: ({ children, ...props }: any) =>
    React.createElement(
      "ul",
      { "data-testid": "mui-list", ...props },
      children
    ),

  ListItem: ({ children, onClick, ...props }: any) =>
    React.createElement(
      "li",
      {
        "data-testid": "mui-listitem",
        onClick,
        ...props,
      },
      children
    ),

  ListItemText: ({ primary, secondary, ...props }: any) =>
    React.createElement(
      "div",
      {
        "data-testid": "mui-listitemtext",
        ...props,
      },
      [
        primary && React.createElement("span", { key: "primary" }, primary),
        secondary &&
          React.createElement("span", { key: "secondary" }, secondary),
      ]
    ),

  // Surfaces
  Paper: ({ children, elevation, ...props }: any) =>
    React.createElement(
      "div",
      {
        "data-testid": "mui-paper",
        "data-elevation": elevation,
        ...props,
      },
      children
    ),

  Card: ({ children, ...props }: any) =>
    React.createElement(
      "div",
      { "data-testid": "mui-card", ...props },
      children
    ),

  CardContent: ({ children, ...props }: any) =>
    React.createElement(
      "div",
      { "data-testid": "mui-cardcontent", ...props },
      children
    ),

  CardActions: ({ children, ...props }: any) =>
    React.createElement(
      "div",
      { "data-testid": "mui-cardactions", ...props },
      children
    ),

  // Utils
  Portal: ({ children }: any) => children,
  ClickAwayListener: ({ children }: any) => children,
  Backdrop: ({ open, children, ...props }: any) =>
    open
      ? React.createElement(
          "div",
          {
            "data-testid": "mui-backdrop",
            ...props,
          },
          children
        )
      : null,
};

// Mock MUI icons
export const mockMuiIcons = {
  Search: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "search-icon", ...props },
      "🔍"
    ),
  Close: (props: any) =>
    React.createElement("span", { "data-testid": "close-icon", ...props }, "✕"),
  Menu: (props: any) =>
    React.createElement("span", { "data-testid": "menu-icon", ...props }, "☰"),
  Add: (props: any) =>
    React.createElement("span", { "data-testid": "add-icon", ...props }, "+"),
  Delete: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "delete-icon", ...props },
      "🗑"
    ),
  Edit: (props: any) =>
    React.createElement("span", { "data-testid": "edit-icon", ...props }, "✏️"),
  Save: (props: any) =>
    React.createElement("span", { "data-testid": "save-icon", ...props }, "💾"),
  Cancel: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "cancel-icon", ...props },
      "❌"
    ),
  Check: (props: any) =>
    React.createElement("span", { "data-testid": "check-icon", ...props }, "✓"),
  ArrowBack: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "arrow-back-icon", ...props },
      "←"
    ),
  ArrowForward: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "arrow-forward-icon", ...props },
      "→"
    ),
  ExpandMore: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "expand-more-icon", ...props },
      "▼"
    ),
  ExpandLess: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "expand-less-icon", ...props },
      "▲"
    ),
  FilterList: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "filter-list-icon", ...props },
      "🔽"
    ),
  Sort: (props: any) =>
    React.createElement("span", { "data-testid": "sort-icon", ...props }, "↕️"),
  Refresh: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "refresh-icon", ...props },
      "🔄"
    ),
  Settings: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "settings-icon", ...props },
      "⚙️"
    ),
  Info: (props: any) =>
    React.createElement("span", { "data-testid": "info-icon", ...props }, "ℹ️"),
  Warning: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "warning-icon", ...props },
      "⚠️"
    ),
  Error: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "error-icon", ...props },
      "❌"
    ),
  Success: (props: any) =>
    React.createElement(
      "span",
      { "data-testid": "success-icon", ...props },
      "✅"
    ),
};

// Mock theme utilities
export const mockTheme = {
  palette: {
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
      contrastText: "#fff",
    },
    secondary: {
      main: "#dc004e",
      light: "#ff5983",
      dark: "#9a0036",
      contrastText: "#fff",
    },
    error: {
      main: "#f44336",
      light: "#e57373",
      dark: "#d32f2f",
      contrastText: "#fff",
    },
    warning: {
      main: "#ff9800",
      light: "#ffb74d",
      dark: "#f57c00",
      contrastText: "#000",
    },
    info: {
      main: "#2196f3",
      light: "#64b5f6",
      dark: "#1976d2",
      contrastText: "#fff",
    },
    success: {
      main: "#4caf50",
      light: "#81c784",
      dark: "#388e3c",
      contrastText: "#fff",
    },
  },
  spacing: (factor: number) => `${8 * factor}px`,
  breakpoints: {
    up: (key: string) => `@media (min-width: 600px)`,
    down: (key: string) => `@media (max-width: 599px)`,
  },
  typography: {
    h1: { fontSize: "2rem" },
    h2: { fontSize: "1.5rem" },
    h3: { fontSize: "1.25rem" },
    body1: { fontSize: "1rem" },
    body2: { fontSize: "0.875rem" },
  },
};

// Setup function for Jest
export const setupMuiMock = (): void => {
  // Mock @mui/material
  jest.doMock("@mui/material", () => mockMuiComponents);

  // Mock @mui/icons-material
  jest.doMock("@mui/icons-material", () => mockMuiIcons);

  // Mock @mui/material/styles
  jest.doMock("@mui/material/styles", () => ({
    createTheme: jest.fn(() => mockTheme),
    ThemeProvider: ({ children }: any) => children,
    useTheme: jest.fn(() => mockTheme),
    styled: jest.fn((component: any) => (styles: any) => component),
    makeStyles: jest.fn(() => () => ({})),
    withStyles: jest.fn(() => (component: any) => component),
  }));

  // Mock @emotion/react
  jest.doMock("@emotion/react", () => ({
    css: jest.fn(),
    jsx: jest.fn(),
    ThemeProvider: ({ children }: any) => children,
    useTheme: jest.fn(() => mockTheme),
  }));

  // Mock @emotion/styled
  jest.doMock("@emotion/styled", () => ({
    default: jest.fn(() => (component: any) => component),
  }));
};

// Cleanup function
export const cleanupMuiMock = (): void => {
  jest.dontMock("@mui/material");
  jest.dontMock("@mui/icons-material");
  jest.dontMock("@mui/material/styles");
  jest.dontMock("@emotion/react");
  jest.dontMock("@emotion/styled");
};

// Helper for creating mock theme context
export const createMockThemeProvider =
  (theme = mockTheme) =>
  ({ children, ...props }: any) =>
    React.createElement(
      "div",
      {
        "data-testid": "theme-provider",
        "data-theme": JSON.stringify(theme),
        ...props,
      },
      children
    );
