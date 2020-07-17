import * as React from 'react';
import { PageSection, Title } from '@patternfly/react-core';
import { ThresholdComparison } from '@app/Auditor/ThresholdComparison';
import { a11yAuditor } from '@seanforyou23/a11y-auditor';
console.log(a11yAuditor());
const Dashboard: React.FunctionComponent = () => (
  <PageSection>
    {/* <Title headingLevel="h1" size="lg">Dashboard Page Title</Title> */}
    <ThresholdComparison />
  </PageSection>
)

export { Dashboard };
