module.exports = {
    locales: ['ar', 'fr'],
    output: './src/$LOCALE.json',
    input: ['src/**/*.{js,jsx,ts,tsx}'],
    keySeparator: false,
    namespaceSeparator: false,
    createOldCatalogs: false,
    sort: true
  };
  