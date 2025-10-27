import React from 'react';
import PropTypes from 'prop-types';

const ActionButton = ({ text, icon, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-red-900 text-white font-bold rounded-lg shadow-md hover:bg-red-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700">
      {icon}
      <span>{text}</span>
    </button>
  );
};

ActionButton.propTypes = {
  text: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  onClick: PropTypes.func,
};

export default ActionButton;