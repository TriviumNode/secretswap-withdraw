import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import '../../styles/components.css';

export const Modal: React.FC = () => {
  const { state, dispatch } = useAppContext();

  if (!state.showModal || !state.modalContent) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      dispatch({ type: 'HIDE_MODAL' });
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {state.modalContent}
      </div>
    </div>
  );
}; 