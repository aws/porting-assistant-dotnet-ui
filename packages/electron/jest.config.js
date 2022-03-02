/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: "node",
  testRegex: ["/src/__tests__/.*\\.(test|spec)\\.(ts|tsx)$"],
  transform: { "^.+\\.ts?$": "ts-jest" },
};
