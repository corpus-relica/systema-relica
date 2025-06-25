import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";

// New type for the quadruple format [role_uid, role_name, kind_uid, kind_name]
type RoleQuadruple = [number, string, number, string];

interface PhysicalObjectKindDetailsProps {
  name?: string;
  uid?: string;
  "possible-kinds-of-roles"?: RoleQuadruple[][];
  category?: string;
  definitions?: string[];
  [key: string]: any; // For other properties
}

// Helper to convert a role quadruple to a more readable structure
interface RoleInfo {
  roleUid: number;
  roleName: string;
  kindUid: number;
  kindName: string;
}

const PhysicalObjectKindDetails: React.FC<PhysicalObjectKindDetailsProps> = (props) => {
  const { 
    name, 
    uid, 
    category,
    definitions,
    "possible-kinds-of-roles": possibleRoles = [] 
  } = props;

  console.log("PhysicalObjectKindDetails", props);

  // Flatten all roles from all levels while maintaining linearization order
  // and convert quadruples to a more readable structure
  const allRoles = React.useMemo(() => {
    return possibleRoles.flat().map((quadruple): RoleInfo => ({
      roleUid: quadruple[0],
      roleName: quadruple[1],
      kindUid: quadruple[2],
      kindName: quadruple[3]
    }));
  }, [possibleRoles]);

  // Group roles by kind_uid for zebra striping
  const rolesByKind = React.useMemo(() => {
    const result: Record<number, boolean> = {};
    let currentKind: number | null = null;
    let isEven = false;
    
    allRoles.forEach(role => {
      if (currentKind !== role.kindUid) {
        currentKind = role.kindUid;
        isEven = !isEven;
      }
      result[role.roleUid] = isEven;
    });
    
    return result;
  }, [allRoles]);

  return (
    <Stack spacing={1} sx={{ p: 1 }}>
      <Box>
        <Typography variant="h6" component="h2">
          {name || "Physical Object"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {category || "physical object"}
        </Typography>
      </Box>

      {definitions && definitions.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            Definitions:
          </Typography>
          {definitions.map((def, index) => (
            <Typography key={index} variant="body2" fontSize="0.75rem">
              {def}
            </Typography>
          ))}
        </Box>
      )}

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight="bold">
          Possible Kinds of Roles ({allRoles.length})
        </Typography>
        
        <Paper 
          variant="outlined" 
          sx={{ 
            mt: 0.5, 
            maxHeight: 200, 
            overflow: 'auto',
            position: 'relative'
          }}
        >
          {allRoles.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 1 }} fontSize="0.75rem">
              No role information available
            </Typography>
          ) : (
            <List dense disablePadding sx={{ p: 0 }}>
              <ListItem 
                sx={{ 
                  py: 0.25,
                  px: 1,
                  bgcolor: 'background.paper',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <Box sx={{ 
                  display: 'grid', 
                  width: '100%',
                  gridTemplateColumns: '45px 1fr 20px 45px 1fr',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: 'text.secondary'
                }}>
                  <Box>UID</Box>
                  <Box>Role</Box>
                  <Box></Box>
                  <Box>UID</Box>
                  <Box>Kind</Box>
                </Box>
              </ListItem>
              
              {allRoles.map((role, index) => {
                const isEvenGroup = rolesByKind[role.roleUid];
                
                return (
                  <ListItem 
                    key={index}
                    disablePadding
                    sx={{ 
                      py: 0.25,
                      px: 1,
                      bgcolor: isEvenGroup ? 'action.hover' : 'background.paper',
                      borderBottom: index < allRoles.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                  >
                    <Box sx={{ 
                      display: 'grid', 
                      width: '100%',
                      gridTemplateColumns: '45px 1fr 20px 45px 1fr',
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      <Chip 
                        size="small" 
                        label={role.roleUid} 
                        color="primary" 
                        variant="outlined"
                        sx={{ 
                          height: '18px', 
                          '& .MuiChip-label': { 
                            px: 0.5, 
                            fontSize: '0.65rem' 
                          } 
                        }}
                      />
                      <Typography 
                        variant="body2" 
                        component="span" 
                        fontWeight="medium"
                        noWrap
                        title={role.roleName}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {role.roleName}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        component="span" 
                        color="text.secondary"
                        align="center"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        as
                      </Typography>
                      <Chip 
                        size="small" 
                        label={role.kindUid} 
                        color="secondary" 
                        variant="outlined"
                        sx={{ 
                          height: '18px', 
                          '& .MuiChip-label': { 
                            px: 0.5, 
                            fontSize: '0.65rem' 
                          } 
                        }}
                      />
                      <Typography 
                        variant="body2" 
                        component="span"
                        noWrap
                        title={role.kindName}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {role.kindName}
                      </Typography>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Paper>
      </Box>
    </Stack>
  );
};

export default PhysicalObjectKindDetails;
