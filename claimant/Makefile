help: ## Print the help documentation
	@grep -E '^[/a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

build: ## Build the app
	yarn build

dev-run: ## Run the app
	yarn start

deps: ## Install dependencies
	yarn install

clean: ## Delete the build/ directory
	rm -rf build

lint-check: ## Run lint checker
	npx eslint .

lint-fix: ## Fix linting issues
	npx eslint --fix .

lint: lint-check lint-fix ## Run all the lint targets (i.e. make lint-check lint-fix)

test-unit: ## Run all unit tests
	yarn test --watchAll=false --testURL https://sandbox.ui.dol.gov:4430/claimant

test-browser: ## Run browser (cypress) tests
	@echo "Not yet implemented"

test: test-unit test-browser ## Run all tests

security: ## Run security scans
	@echo "yarn audit disabled"
	# https://overreacted.io/npm-audit-broken-by-design/
	# yarn audit

list-outdated: ## List outdated dependencies
	npx retire

default: help

.PHONY: build dev-run deps clean lint-check lint-fix lint