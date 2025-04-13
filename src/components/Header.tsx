import { AppBar, Toolbar, Typography } from '@mui/material';

const Header = () => {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          CISE Visa Direct Playground
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 