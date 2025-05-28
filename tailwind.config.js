/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'chat-blue': '#3498db', // .send-button, .edit-query-button
        'chat-blue-hover': '#2980b9',
        'chat-dark': '#2d2d2d', // .styled-table thead
        'chat-dark-border': '#3e3e3e',
        'chat-light-gray': '#f5f5f5', // .cypher-query
        'chat-gray': '#f9f9f9', // .chat-window
        'chat-error': '#e74c3c', // .cancel-button
        'chat-error-hover': '#c0392b',
        'chat-success': '#28a745', // .save-button
        'chat-success-hover': '#218838',
        'chat-resume': '#f1c40f', // .resume-button
        'chat-user-bg': '#e3f2fd', // .user-message
        'chat-bot-bg': '#e4efe7', // .bot-message
        'chat-disabled': '#bdc3c7', // .send-button:disabled
      },
      fontFamily: {
        code: ['Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'chat': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'modal': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'input': 'inset 0 1px 2px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
};