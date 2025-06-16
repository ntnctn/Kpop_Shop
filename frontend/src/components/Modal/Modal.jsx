import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const Modal = ({ open, onClose, title, children }) => {
  return (
    <Dialog 
      className="modal"
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: 'calc(100vh - 64px)',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle className="modal-title">
        {title}
        <IconButton
        className="button-close"
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers className="modal-content">
        <div className="modal-content-wrapper">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};