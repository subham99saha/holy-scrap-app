import React, { useEffect, useState } from 'react';

const Notification = ({ message, onTimeout, onCancel }) => {
  useEffect(() => {
    // console.log({message})
    const timer = setTimeout(onTimeout, 3000); // Auto-close after 5 seconds
    return () => clearTimeout(timer); // Cleanup on unmount or when manually closed
  }, [onTimeout]);

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 mb-4 max-w-72 flex items-center space-x-4 animate-fade-in-out transition-opacity duration-300 ease-in-out">
      {/* Add support for images or any custom content inside the notification */}
      {message.image && (
        <img
          src={`${process.env.PUBLIC_URL}/images/logos/${message.image}`}
          alt="Notification"
          className="w-8 h-8 p-1 object-cover border rounded-full shadow-xl"
        />
      )}
      <div className="flex-1 pr-3">
        {/* Notification text content */}
        {message.head && (<h1 className="font-bold text-xs">{message.head}</h1>)}
        <p className="text-gray-600 text-xs">{message.text}</p>
      </div>
      <button
        onClick={onCancel}
        className="text-gray-500 text-xs hover:text-gray-600 focus:outline-none"
      >
        ✕
      </button>
    </div>
  );
};

export default Notification;