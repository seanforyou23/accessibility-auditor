import * as React from 'react';
import { PageSection, Title } from '@patternfly/react-core';
import { ChartBullet } from '@patternfly/react-charts';
import violatingPages from '@app/data.json';
let totalViolations = 0;
violatingPages.forEach((page) => {
  totalViolations += page.violations.length
});

const ThresholdComparison: React.FunctionComponent = () => (
  <PageSection>
    <Title headingLevel="h1">A11y errors vs tolerance threshold</Title>
    <div style={{ height: '150px', width: '600px' }}>
      <ChartBullet
        ariaTitle="Accessibility errors versus tolerance threshold"
        ariaDesc="Compares total number of accessibility errors as compared to the maximum allowed value."
        comparativeErrorMeasureData={[{name: 'Error threshold', y: 20}]}
        comparativeErrorMeasureLegendData={[{ name: 'Maximum tolerance threshold' }]}
        constrainToVisibleArea
        height={150}
        labels={({ datum }) => `${datum.name}: ${datum.y}`}
        maxDomain={{y: 50}}
        primarySegmentedMeasureData={[{ name: 'Total number of accessibility violations', y: totalViolations }]}
        qualitativeRangeData={[{ name: '😄 less than', y: 5 }, { name: '😑 less than', y: 20 }, { name: '🙁 less than', y: 100 }]}
        width={600}
      />
    </div>
  </PageSection>
)

export { ThresholdComparison };
