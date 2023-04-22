#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const app = new App();

// eslint-disable-next-line no-new
new CdkStack(app, 'F1FlatLayerStack');
