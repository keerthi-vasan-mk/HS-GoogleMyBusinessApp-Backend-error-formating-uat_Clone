module.exports = {
	globals: {
		'ts-jest': {
			tsConfigFile: 'tsconfig.json'
		}
	},
	moduleFileExtensions: [
		'ts',
		'js',
		'json'
	],
	transform: {
		'^.+\\.(ts|tsx)$': './node_modules/ts-jest/preprocessor.js'
	},
	testMatch: [
		'**/tests/feature/**/*.test.(ts|js)',
		'**/tests/integration/**/*.test.(ts|js)'
	],
	testEnvironment: 'node'
};