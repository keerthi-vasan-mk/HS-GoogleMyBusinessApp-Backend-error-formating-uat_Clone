#!make
# ------------------------------------------------------------------------------
# Makefile -- Hootsuite GMB
# ------------------------------------------------------------------------------

# Ensure that a .env file exists in the root directory.
# ifeq ($(wildcard ./.env),)
#   $(shell cp .config/.env.local .env)
# endif
# ifeq ($(wildcard ./ormconfig.json),)
#   $(shell cp .config/ormconfig.local.json ormconfig.json)
# endif
# ifeq ($(wildcard ./.env),)
#   $(shell cp .config/.env.dev .env)
# endif

# include .env
include .env

# Set environment variables for local development or CI/CD pipelines
export $(shell sed 's/=.*//' .env)
export DEPLOY_DATE?=$(shell date '+%Y%m%d%H%M')
export GIT_LOCAL_BRANCH?=$(shell git rev-parse --abbrev-ref HEAD)


export PROJECT := $(or $(PROJECT),hootsuite-gmb)
export POSTGRES_USER := $(or $(POSTGRES_USER),freshworks)
export POSTGRES_PASSWORD := $(or $(POSTGRES_PASSWORD1),'admin123$')
export POSTGRES_DB := $(or $(POSTGRES_DB),freshworks)
export DB_SERVER := $(or $(DB_SERVER),postgres)
export DB_PORT := $(or $(DB_PORT),5432)
export BUILD_TARGET := $(or $(BUILD_TARGET),development)
export TAG := $(or $(TAG),devpatch)

define deployTag
"${PROJECT}-${GIT_LOCAL_BRANCH}-${DEPLOY_DATE}"
endef

DIR := ${CURDIR}

all 		  : help
.DEFAULT 	: help
.PHONY	  : local workspace close-local setup-local build-local print-status

# ------------------------------------------------------------------------------
# Task Aliases
# ------------------------------------------------------------------------------

local:  | setup-local build-local run-local ## Task-Alias -- Run the steps for a local-build.
deploy-dev: | print-status deploy-prep-dev deploy-build deploy-tag deploy-push deploy-prep-dev deploy-version ## Task-Alias -- Builds and runs the containers for deployment.
deploy-staging: | print-status deploy-prep-staging deploy-build deploy-tag deploy-push deploy-prep-staging deploy-version ## Task-Alias -- Builds and runs the containers for deployment.
deploy-prod: | print-status deploy-prep-prod deploy-build-prod deploy-tag-prod deploy-push-prod deploy-prep-prod deploy-version-prod ## Task-Alias -- Builds and runs the containers for deployment.

# ------------------------------------------------------------------------------
# Status Output
# ------------------------------------------------------------------------------

print-status:
	@echo " +---------------------------------------------------------+ "
	@echo " | Current Settings                                        | "
	@echo " +---------------------------------------------------------+ "
	@echo " | PROJECT:      $(PROJECT) "
	@echo " | BRANCH:       $(GIT_LOCAL_BRANCH) "
	@echo " +---------------------------------------------------------+ "
	@echo " | BUILD_TARGET: $(BUILD_TARGET) "
	@echo " | ENVIRONMENT:  $(ENVIRONMENT) "
	@echo " +---------------------------------------------------------+ "
	@echo " | Docker-Compose Config Output "
	@echo " +---------------------------------------------------------+ "
	@docker-compose -f docker-compose.yml config
	@echo " +---------------------------------------------------------+ "

# ------------------------------------------------------------------------------
# Account/Container Setup
# ------------------------------------------------------------------------------

create-ecr-repos: ## -- SETUP : Intializes the remote ecr repos - only run once
	@echo "+\n++ Creating EC2 Container repositories ...\n+"
	@$(shell aws ecr get-login --no-include-email --profile $(PROFILE) --region $(REGION))
	@aws ecr create-repository --profile $(PROFILE) --region $(REGION) --repository-name $(REPO)/codebase || :
	@aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly --profile $(PROFILE) --region $(REGION)

# ------------------------------------------------------------------------------
# Development Commands
# ------------------------------------------------------------------------------

setup-local: ## -- Target : Prepares the environment variables for local development.
	@echo "+\n++ Make: Preparing project for local development ...\n+"
#ToDo: update setup-local
#@cp .config/.env.local .env
# @cp .config/ormconfig.local.json ormconfig.json

build-local: ## -- Target : Builds the local development containers.
	@echo "+\n++ Make: Building local Docker image ...\n+"
	@docker-compose build


run-local: ## -- Target : Runs the local development containers.
	@echo "+\n++ Make: Running locally ...\n+"
	@docker-compose up --remove-orphans

run-local-db: ## -- Target : Runs the local development containers.
	@echo "+\n++ Make: Running locally ...\n+"
	@docker-compose up postgres

run-local-server: ## -- Target : Runs the local development containers.
	@echo "+\n++ Make: Running locally ...\n+"
	@docker-compose up application

close-local: ## -- Target : Closes the local development containers.
	@echo "+\n++ Make: Closing local container ...\n+"
	@docker-compose down

# ------------------------------------------------------------------------------
# AWS Deployment
# ------------------------------------------------------------------------------

deploy-prep-dev: ## -- Target : Prepares .env for deployment to dev
	@echo "+\n++ Preparing for Deploying to AWS...\n+"
	@cp .config/.env.dev .env
	@cp .config/ormconfig.dev.json ormconfig.json
	@.build/env_options.sh < .env > .ebextensions/options.config
	@.build/build_dockerrun.sh > Dockerrun.aws.json

deploy-prep-staging: ## -- Target : Prepares .env for deployment to staging
	@echo "+\n++ Preparing for Deploying to AWS...\n+"
	@cp .config/.env.staging .env
	@cp .config/ormconfig.staging.json ormconfig.json
	@.build/env_options.sh < .env > .ebextensions/options.config
	@.build/build_dockerrun.sh > Dockerrun.aws.json

deploy-build: ## -- Target : Builds images for deployment
	@echo "+\n++ Performing build of Docker images for Jenkins Run...\n+"
	@docker-compose -f docker-compose.deploy.yml build
	

deploy-tag: ## -- Target : Tags images for deployment
	@echo "+\n++ Tagging images for Deployment...\n+"
	@docker tag $(PROJECT)_codebase:$(TAG) $(ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com/$(REPO):$(TAG)

deploy-push: ## -- Target : Pushes images for deployment
	@echo "+\n++ Pushing images to Dockerhub...\n+"
	@docker login -u AWS -p $(shell aws ecr get-login-password --region $(REGION)) $(ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com
	@docker push $(ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com/$(REPO):$(TAG)
	

deploy-stop: ## -- Target : Stops the local containers
	@echo "+\n++ Stopping Processes...\n+"
	@docker-compose -f docker-compose.deploy.yml down

deploy-run:  ## -- Target : Runs the local containers as if it was for deployment
	@echo "+\n++ Running project locally via docker-compose without Nginx ...\n+"
	@docker-compose -f docker-compose.deploy.yml down
	@docker-compose -f docker-compose.deploy.yml up -d application

deploy-version: ## -- Target : Deploys images
	@echo "+\n++ Deploying to AWS...\n+"
	@zip -r $(call deployTag).zip .ebextensions Dockerrun.aws.json
	@aws --profile $(PROFILE) configure set region $(REGION)
	@echo "aws s3 cp $(call deployTag).zip s3://$(BUCKET_NAME)/$(PROJECT)/$(call deployTag).zip"
	@aws --profile $(PROFILE) s3 cp $(call deployTag).zip s3://$(BUCKET_NAME)/$(PROJECT)/$(call deployTag).zip
	@aws --profile $(PROFILE) elasticbeanstalk create-application-version --application-name $(PROJECT) --version-label $(call deployTag) --source-bundle S3Bucket="$(BUCKET_NAME)",S3Key="$(PROJECT)/$(call deployTag).zip"
	@aws --profile $(PROFILE) elasticbeanstalk update-environment --application-name $(PROJECT) --environment-name $(PROJECT)-$(ENVIRONMENT) --version-label $(call deployTag)

# ------------------------------------------------------------------------------
# AWS Deployment Production
# ------------------------------------------------------------------------------

deploy-prep-prod: ## -- Target : Prepares .env for deployment to dev
	@echo "+\n++ Preparing for Deploying to AWS...\n+"
	@cp .config/.env.production .env
	@cp .config/ormconfig.production.json ormconfig.json
	@.build/env_options.sh < .env > .ebextensions/options.config
	@.build/build_dockerrun_production.sh > Dockerrun.aws.json

deploy-build-prod: ## -- Target : Builds images for deployment
	@echo "+\n++ Performing build of Docker images for Jenkins Run...\n+"
	@docker-compose -f docker-compose.deploy.yml build

deploy-tag-prod: ## -- Target : Tags images for deployment
	@echo "+\n++ Tagging images for Deployment...\n+"
	@docker tag $(PROJECT)_codebase:$(GIT_LOCAL_BRANCH) $(ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com/$(REPO):production

deploy-push-prod: ## -- Target : Pushes images for deployment
	@echo "+\n++ Pushing images to Dockerhub...\n+"
	@$(shell aws ecr get-login-password --no-include-email --profile $(PROFILE) --region $(REGION))
	@docker push $(ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com/$(REPO):production

deploy-version-prod: ## -- Target : Deploys images
	@echo "+\n++ Deploying to AWS...\n+"
	@zip -r $(call deployTag).zip .ebextensions Dockerrun.aws.json
	@aws --profile $(PROFILE) configure set region $(REGION)
	@echo "aws s3 cp $(call deployTag).zip s3://$(BUCKET_NAME)/$(PROJECT)/$(call deployTag).zip"
	@aws --profile $(PROFILE) s3 cp $(call deployTag).zip s3://$(BUCKET_NAME)/$(PROJECT)/$(call deployTag).zip
	@aws --profile $(PROFILE) elasticbeanstalk create-application-version --application-name "Google My Business API" --version-label $(call deployTag) --source-bundle S3Bucket="$(BUCKET_NAME)",S3Key="$(PROJECT)/$(call deployTag).zip"
	@aws --profile $(PROFILE) elasticbeanstalk update-environment --application-name "Google My Business API" --environment-name $(PROJECT)-$(ENVIRONMENT) --version-label $(call deployTag)


# ------------------------------------------------------------------------------
# Helper Commands
# ------------------------------------------------------------------------------

workspace:  ## <Helper> :: Executes into the workspace container.
	@echo "Make: Shelling into local workspace ..."
	@docker-compose exec application bash

database: ## <Helper> :: Executes into the database container.
	@echo "Shelling into local workspace ..."
	@export PGPASSWORD=$(POSTGRES_PASSWORD)
	@docker-compose exec postgres psql -U $(POSTGRES_USER) $(POSTGRES_DB)

healthcheck: ## <Helper> :: Runs aws health-check on the instance
	@aws --profile $(PROFILE) elasticbeanstalk describe-environments --application-name $(PROJECT) --environment-name $(PROJECT)-$(ENVIRONMENT) --query 'Environments[*].{Status: Status, Health: Health}'

help:  ## ** Display this help screen.
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# ------------------------------------------------------------------------------
# Test pipeline commands
# ------------------------------------------------------------------------------	

run-test:
	@echo "+\n++ Make: Running test build ...\n+"
	@docker-compose up -d

run-server-test:
	@docker exec -i $(PROJECT)-application npm run test:pipeline

close-test:
	@echo "+\n++ Make: Closing test container ...\n+"
	@docker-compose down
