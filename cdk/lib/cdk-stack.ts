import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LayerVersion, Code } from 'aws-cdk-lib/aws-lambda';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const layer = new LayerVersion(this, 'F1FlatDataLayer', {
      code: Code.fromAsset('../f1flat_data_layer.zip'),
      description: 'Lambda Layer for F1 Flat SQLite data',
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
