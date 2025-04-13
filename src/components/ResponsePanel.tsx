import { Paper, Box, Typography, Tab, Tabs } from '@mui/material';
import { useState } from 'react';

interface ResponsePanelProps {
  response: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ResponsePanel = ({ response }: ResponsePanelProps) => {
  const [tabValue, setTabValue] = useState(0);

  const formatHeaders = (headers: any) => {
    if (!headers) return 'No headers';
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Response</Typography>
        {response?.headers?.['x-correlation-id'] && (
          <Typography variant="body2" color="text.secondary">
            X-Correlation-ID: {response.headers['x-correlation-id']}
          </Typography>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Headers" />
          <Tab label="Body" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {formatHeaders(response?.headers)}
        </pre>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {response?.data ? JSON.stringify(response.data, null, 2) : 'No response body'}
        </pre>
      </TabPanel>
    </Paper>
  );
};

export default ResponsePanel; 