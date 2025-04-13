import { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Collapse,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface SidebarProps {
  selectedEndpoint: string;
  onEndpointSelect: (endpoint: string) => void;
}

interface SavedEndpoint {
  name: string;
  url: string;
}

const Sidebar = ({ selectedEndpoint, onEndpointSelect }: SidebarProps) => {
  const [savedEndpoints, setSavedEndpoints] = useState<SavedEndpoint[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [newEndpoint, setNewEndpoint] = useState({ name: '', url: '' });

  useEffect(() => {
    // Load saved endpoints from localStorage
    const saved = localStorage.getItem('savedEndpoints');
    if (saved) {
      setSavedEndpoints(JSON.parse(saved));
    }
  }, []);

  const handleSaveEndpoint = () => {
    if (newEndpoint.name && newEndpoint.url) {
      const updatedEndpoints = [...savedEndpoints, newEndpoint];
      setSavedEndpoints(updatedEndpoints);
      localStorage.setItem('savedEndpoints', JSON.stringify(updatedEndpoints));
      setNewEndpoint({ name: '', url: '' });
    }
  };

  const handleEndpointClick = (url: string) => {
    onEndpointSelect(url);
    // Collapse the saved endpoints when one is selected
    setIsExpanded(false);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: '#1e1e1e',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8 }}>
        <List>
          <ListItem>
            <ListItemText primary="Saved Endpoints" />
            <IconButton onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {savedEndpoints.map((endpoint, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleEndpointClick(endpoint.url)}
                  selected={selectedEndpoint === endpoint.url}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon>
                    <SendIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={endpoint.name}
                    secondary={endpoint.url}
                    secondaryTypographyProps={{
                      style: {
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />
                </ListItem>
              ))}
              <ListItem sx={{ pl: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                  <TextField
                    size="small"
                    placeholder="Endpoint Name"
                    value={newEndpoint.name}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                  />
                  <TextField
                    size="small"
                    placeholder="URL"
                    value={newEndpoint.url}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
                  />
                  <IconButton
                    onClick={handleSaveEndpoint}
                    disabled={!newEndpoint.name || !newEndpoint.url}
                    sx={{ alignSelf: 'flex-end' }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </ListItem>
            </List>
          </Collapse>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 