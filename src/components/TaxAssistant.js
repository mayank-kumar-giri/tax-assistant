import '../App.css';
import React, { useEffect, useRef, useState } from 'react';
import { Steps, Divider, Form, Input, Button, Radio, Table, Tag, Space, Card, Tooltip, Typography, Collapse, Tabs } from 'antd';
import {
  isEmpty as _isEmpty,
  path as _path,
  isNil as _isNil,
} from 'ramda';
import { inWords, capitalize, beautifyNumber, numerize, round } from '../services/utils';
import useStateWithCallback from '../hooks/useStateWithCallback';

const { Step } = Steps;
const { Text, Paragraph, Title } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const cardStyle = { 
  borderRadius: "16px", 
  margin: "24px", 
  boxShadow: "6px 6px 10px 3px rgba(208, 216, 243, 0.6)",
};

const resultCardStyle = { 
  borderRadius: "16px", 
  margin: "0px 8px", 
  boxShadow: "6px 6px 10px 3px rgba(208, 216, 243, 0.6)",
};

const buttonStyle = {
  borderRadius: "4px",
  margin: "10px",
  padding: "10px 10px 30px 10px",
  alignment: "center"
};

const skipButtonStyle = {
  borderRadius: "12px",
  padding: "4px 12px 12px 12px",
  alignment: "center"
};

const textDivStyle = {
  padding: "16px 12px 0px 16px",
  fontSize: 15,
};

const cityTypes = {
  metro   : 'metro',
  nonMetro: 'non-metro',
};

const ageGroups = {
  below60: 'below60',
  above60: 'above60',
};

const defaultInvestmentDetails = {
  city: cityTypes.nonMetro,
  nps80ccd1b: "0",
  nps80ccd2: "0",
  other80c: "0",
  otherExemptionsNewRegime: "0",
  otherExemptionsOldRegime: "0",
  parents80d: "0",
  parentsAge: ageGroups.below60,
  pf80c: "0",
  rent: "0",
  self80d: "0",
  selfAge: ageGroups.below60,
};

const formItemLayout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 14,
  },
};

const buttonItemLayout = {
  wrapperCol: {
    span: 14,
    offset: 4,
  },
};

const amountRules = [
  { pattern: '^[0-9]+$', message: 'This has to be a positive number'}
];

const oldTaxRates = {
  '0'      : 0,
  '250000' : 5,
  '500000' : 20,
  '750000' : 20,
  '1000000': 30,
  '1250000': 30,
  '1500000': 30,
};

const newTaxRates = {
  '0'      : 0,
  '250000' : 5,
  '500000' : 10,
  '750000' : 15,
  '1000000': 20,
  '1250000': 25,
  '1500000': 30,
};

const regimes = {
  new: 'new',
  old: 'old',
};

const getTaxRate = (base, regime) => (
  (regime===regimes.old)
    ? oldTaxRates[String(base)]
    : newTaxRates[String(base)]
);

const getTotalTax = (grossSalary, regime) => {
  var current = 0;
  var difference = Math.abs(grossSalary-current);
  var totalTax = 0;
  while(current !== grossSalary) {
    totalTax += (250000.0 * getTaxRate(current, regime))/100;
    current += 250000;
    difference = Math.abs(grossSalary-current);
    if(current===1500000) break;
    if(difference <= 250000) break;
  }
  totalTax += (difference * getTaxRate(current, regime))/100;
  return totalTax;
};

function TaxAssistant(props) {
  const [currentStep, setCurrentStep] = useStateWithCallback(0);
  const [salaryDetails, setSalaryDetails] = useStateWithCallback({});
  const [investmentDetails, setInvestmentDetails] = useStateWithCallback({});
  const [salaryForm] = Form.useForm();
  const [investmentForm] = Form.useForm();
  const [exemptionMetrics, setExemptionMetrics] = useState({});

  const salaryStepRef = useRef();
  const investmentStepRef = useRef();
  const resultStepRef = useRef();

  const areValidInputsPresent = !_isEmpty(salaryDetails) && !_isEmpty(investmentDetails);

  useEffect(() => {
    salaryForm.resetFields();
    investmentForm.resetFields();
    !_isEmpty(salaryDetails) && salaryForm.setFieldsValue(salaryDetails);
    !_isEmpty(investmentDetails) && investmentForm.setFieldsValue(investmentDetails);
  }, [currentStep]);
  
  const onChange = current => setCurrentStep(current);

  const { hra, sec16, sec80c, sec80d, nps, other } = exemptionMetrics;

  const calculateHraDetails = (salaryDetails, investmentDetails) => {
    const { basicSalary, hraComponent } = salaryDetails;
    const { rent, city } = investmentDetails;
    const [_basicSalary, _hraComponent, _rent] = [basicSalary, hraComponent, rent].map(item => Number(item));
    const basicMultiplier = (city===cityTypes.metro) ? 0.5 : 0.4;
    const factorOfBasic = round(basicMultiplier * _basicSalary);
    const currentRent = _rent;
    const currentRentLessBasic = Math.max(round(_rent - (0.1 * _basicSalary)), 0);
    const optimalRent = Math.min((0.5 * _basicSalary), (_hraComponent + (0.1 * _basicSalary)));
    const optimalRentLessBasic = Math.max(round(optimalRent - (0.1 * _basicSalary)), 0);
    const currentHraExemption = Math.min(currentRentLessBasic, factorOfBasic, _hraComponent);
    const optimalHraExemption = Math.min(optimalRentLessBasic, factorOfBasic, _hraComponent);

    return {
      hraComponent: _hraComponent,
      currentRent,
      currentRentLessBasic,
      optimalRent,
      optimalRentLessBasic,
      basicMultiplier,
      factorOfBasic,
      currentHraExemption,
      optimalHraExemption,
    };
  };

  const calculate80cDetails = investmentDetails => {
    const { pf80c, other80c } = investmentDetails;
    const [_pf80c, _other80c] = [pf80c, other80c].map(item => Number(item));
    const optimal80cExemption = 150000;
    const current80cExemption = Math.min(optimal80cExemption, (_pf80c + _other80c));
    const optimalOther80cExemption = optimal80cExemption - _pf80c;

    return {
      pf80c   : _pf80c,
      other80c: _other80c,
      current80cExemption,
      optimal80cExemption,
      optimalOther80cExemption,
    };
  };

  const calculate80dDetails = investmentDetails => {
    const { self80d, parents80d, parentsAge, selfAge } = investmentDetails;
    const [_self80d, _parents80d] = [self80d, parents80d].map(item => Number(item));
    const optimalself80dExemption = (selfAge===ageGroups.below60) ? 25000 : 50000;
    const optimalParents80dExemption = (parentsAge===ageGroups.below60) ? 25000 : 50000;
    const currentSelf80dExemption = Math.min(optimalself80dExemption, _self80d);
    const currentParents80dExemption = Math.min(optimalParents80dExemption, _parents80d);
    
    return {
      currentSelf80dExemption,
      currentParents80dExemption,
      optimalself80dExemption,
      optimalParents80dExemption,
    };
  };

  const calculateNpsDetails = (salaryDetails, investmentDetails) => {
    const { basicSalary } = salaryDetails;
    const _basicSalary = Number(basicSalary);
    const { nps80ccd1b, nps80ccd2 } = investmentDetails;
    const [_nps80ccd1b, _nps80ccd2] = [nps80ccd1b, nps80ccd2].map(item => Number(item));
    const optimalNps80ccd1bExemption = 50000;
    const currentNps80ccd1bExemption = Math.min(optimalNps80ccd1bExemption, _nps80ccd1b);
    const optimalNps80ccd2Exemption = round(0.1 * _basicSalary);
    const currentNps80ccd2Exemption = Math.min(optimalNps80ccd2Exemption, _nps80ccd2);

    return {
      optimalNps80ccd1bExemption,
      currentNps80ccd1bExemption,
      optimalNps80ccd2Exemption,
      currentNps80ccd2Exemption,
    };
  };

  const calculateOtherInvestmentDetails = investmentDetails => {
    const { otherExemptionsOldRegime, otherExemptionsNewRegime } = investmentDetails;
    const [_otherExemptionsOldRegime, _otherExemptionsNewRegime] = [otherExemptionsOldRegime, otherExemptionsNewRegime].map(item => Number(item));

    return {
      otherExemptionsOldRegime: _otherExemptionsOldRegime, 
      otherExemptionsNewRegime: _otherExemptionsNewRegime,
    };
  };

  const calculateAndSaveExemptions = (salaryDetails, investmentDetails) => {
    const exemptionPayload = {
      hra   : calculateHraDetails(salaryDetails, investmentDetails),
      sec16 : 50000,
      sec80c: calculate80cDetails(investmentDetails),
      sec80d: calculate80dDetails(investmentDetails),
      nps   : calculateNpsDetails(salaryDetails, investmentDetails),
      other : calculateOtherInvestmentDetails(investmentDetails),
    };
    setExemptionMetrics(exemptionPayload);
  };

  const skipToResults = () => setCurrentStep(2, () => resultStepRef.current.scrollIntoView({ behavior: 'smooth' }));

  const submitSalaryDetails = () => {
    setSalaryDetails(salaryForm.getFieldsValue(), salaryDetails => {
      setInvestmentDetails(defaultInvestmentDetails, investmentDetails => calculateAndSaveExemptions(salaryDetails, investmentDetails));
    });
    setCurrentStep(1, () => investmentStepRef.current.scrollIntoView({ behavior: 'smooth' }));
  }

  const submitInvestmentDetails = () => {
    setInvestmentDetails(investmentForm.getFieldsValue(), investmentDetails => calculateAndSaveExemptions(salaryDetails, investmentDetails));
    setCurrentStep(2, () => resultStepRef.current.scrollIntoView({ behavior: 'smooth' }));
  }

  const columns = () => [
    {
      title    : 'Slabs',
      dataIndex: 'slab',
    },
    {
      title    : 'Income in this Slab',
      dataIndex: 'incomeInSlab',
    },
    {
      title    : 'Tax Rate in Old Regime',
      dataIndex: 'oldTaxRate',
    },
    {
      title    : 'Tax in Old Regime',
      dataIndex: 'oldTax',
    },
    {
      title    : 'Tax Rate in New Regime',
      dataIndex: 'newTaxRate',
    },
    {
      title    : 'Tax Rate in New Regime',
      dataIndex: 'newTax',
    },
  ];

  const taxTableData = () => {
    const data = [];
    const grossSalary = Number(salaryDetails.grossSalary);
    var current = 0;
    var difference = Math.abs(grossSalary-current);

    while(current !== grossSalary) {
      data.push({
        slab        : `${beautifyNumber(current)}/- to ${beautifyNumber(current + 250000)}/-`,
        incomeInSlab: beautifyNumber(250000),
        oldTaxRate  : `${getTaxRate(current, regimes.old)}%`,
        oldTax      : beautifyNumber((250000.0 * getTaxRate(current, regimes.old))/100),
        newTaxRate  : `${getTaxRate(current, regimes.new)}%`,
        newTax      : beautifyNumber((250000.0 * getTaxRate(current, regimes.new))/100),
      });
      
      current += 250000;
      difference = Math.abs(grossSalary-current);
      if(current===1500000) break;
      if(difference <= 250000) break;
    }

    data.push({
      slab        : `${beautifyNumber(current)}/- to ${(current===1500000) ? beautifyNumber(grossSalary) : beautifyNumber(current + 250000)}/-`,
      incomeInSlab: beautifyNumber(difference),
      oldTaxRate  : `${getTaxRate(current, regimes.old)}%`,
      oldTax      : beautifyNumber((difference * getTaxRate(current, regimes.old))/100),
      newTaxRate  : `${getTaxRate(current, regimes.new)}%`,
      newTax      : beautifyNumber((difference * getTaxRate(current, regimes.new))/100),
    });

    return data;
  };

  return (
    <React.Fragment>
      <Steps 
        current={currentStep} 
        onChange={onChange} 
        direction="vertical"
      >
        <Step
          title={<h5 ref={salaryStepRef}>Enter your Salary Details</h5>}
          description={
            <React.Fragment>
              <Card style={cardStyle}>
                <Form
                  {...formItemLayout}
                  layout={'horizontal'}
                  labelWrap
                  form={salaryForm}
                  onFinish={submitSalaryDetails}
                >
                  <Form.Item 
                    name="grossSalary" 
                    label="Gross Annual Salary"
                    rules={amountRules.concat([
                      { required: true, message: 'Please enter the Gross Salary' }
                    ])}
                    hasFeedback
                  >
                      <Input placeholder="Enter your gross annual salary" />
                  </Form.Item>
                  <Form.Item 
                    name="basicSalary" 
                    label="Basic Salary"
                    rules={amountRules.concat([
                      { required: true, message: 'Please enter the Basic Salary' }
                    ])}
                    hasFeedback
                  >
                    <Input placeholder="Enter your Basic Salary" />
                  </Form.Item>
                  <Form.Item 
                    name="hraComponent" 
                    label="House Rent Allowance (HRA)"
                    rules={amountRules.concat([
                      { required: true, message: 'Please enter the HRA component' }
                    ])}
                    hasFeedback
                  >
                    <Input placeholder="Enter your salary's HRA component" />
                  </Form.Item>
                  <Form.Item {...buttonItemLayout}>
                    <Button 
                      type="primary"
                      htmlType='submit'
                      disabled={currentStep!==0}
                      style={buttonStyle}
                    >
                      Submit Salary Details
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </React.Fragment>
          } 
        />
        <Step 
          title={
            <div className='row' style={{width: '120%'}}>
              <h5 className='col-10' ref={investmentStepRef}>Enter your Investment Details</h5>
              <Button 
                type="warning"
                className='col-2'
                onClick={skipToResults}
                disabled={currentStep!==1}
                style={skipButtonStyle}
              >
                Skip
              </Button>
            </div>
          }
          description={
            <React.Fragment>
              <Card style={cardStyle}>
                <Form
                  {...formItemLayout}
                  layout={'horizontal'}
                  labelWrap
                  form={investmentForm}
                  onFinish={submitInvestmentDetails}
                >
                  <Card title='House Rent Allowance' bordered={false}>
                    <Form.Item 
                      name='rent' 
                      label="Annual Rent Paid"
                      rules={amountRules.concat([
                        { required: true, message: 'Please enter your Annual Rent' }
                      ])}
                      hasFeedback
                    >
                      <Input placeholder="Enter Annual Rent that you pay" />
                    </Form.Item>
                    <Form.Item 
                      name='city' 
                      label="Metro/Non-Metro"
                      rules={[
                        { required: true, message: 'Please select Metro/Non-metro' }
                      ]}
                      hasFeedback
                    >
                      <Radio.Group>
                        <Radio.Button value={cityTypes.metro}>Metro</Radio.Button>
                        <Radio.Button value={cityTypes.nonMetro}>Non-Metro</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                  </Card>
                  
                  <Card title='Section 80C' bordered={false}>
                    <Form.Item 
                      name='pf80c' 
                      label="Employee's share of Provident Fund"
                      rules={amountRules.concat([
                        { required: true, message: 'Please enter the Employee\'s share of PF' }
                      ])}
                      hasFeedback
                    >
                      <Input placeholder="Enter employee's share of PF" />
                    </Form.Item>
                    <Form.Item 
                      name='other80c' 
                      label="Total of other investments in 80C" 
                      rules={amountRules} 
                      hasFeedback
                    >
                      <Input placeholder="Enter total of other investments in 80C" />
                    </Form.Item>
                  </Card>

                  <Card title='Section 80D (Medical Insurance Premium)' bordered={false}>
                  <Form.Item 
                      name='selfAge' 
                      label="Self Age"
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, selfAge) {
                            const self80d = getFieldValue('self80d');
                            if(!self80d || (!!self80d && !!selfAge)) return Promise.resolve();
                            else return Promise.reject('Please select Below 60/Above 60');
                          },
                        }),
                      ]}
                      hasFeedback
                    >
                      <Radio.Group>
                        <Radio.Button value={ageGroups.below60}>Below 60</Radio.Button>
                        <Radio.Button value={ageGroups.above60}>Above 60</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item 
                      name='self80d' 
                      label="For Self" 
                      rules={amountRules} 
                      hasFeedback
                    >
                      <Input placeholder="Enter premium of your medical insurance" />
                    </Form.Item>
                    <Form.Item 
                      name='parentsAge' 
                      label="Parents' Age"
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, parentsAge) {
                            const parents80d = getFieldValue('parents80d');
                            if(!parents80d || (!!parents80d && !!parentsAge)) return Promise.resolve();
                            else return Promise.reject('Please select Below 60/Above 60');
                          },
                        }),
                      ]}
                      hasFeedback
                    >
                      <Radio.Group>
                        <Radio.Button value={ageGroups.below60}>Below 60</Radio.Button>
                        <Radio.Button value={ageGroups.above60}>Above 60</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item 
                      name='parents80d' 
                      label="For Parents under 60 yrs of age" 
                      rules={amountRules} 
                      hasFeedback
                    >
                      <Input placeholder="Enter premium of parents' medical insurance" />
                    </Form.Item>
                  </Card>

                  <Card title='National Pension Scheme (NPS)' bordered={false}>
                    <Form.Item 
                      name='nps80ccd1b' 
                      label="Under Section 80CCD (1b)" 
                      rules={amountRules} 
                      hasFeedback
                    >
                      <Input placeholder="Enter amount invested in NPS account" />
                    </Form.Item>
                    <Form.Item 
                      name='nps80ccd2' 
                      label="Under Section 80CCD (2)" 
                      rules={amountRules} 
                      hasFeedback
                    >
                      <Input placeholder="Enter amount invested in NPS account" />
                    </Form.Item>
                  </Card>

                  <Card title='Any other Income Tax exemptions that one is eligible for' bordered={false}>
                    <Form.Item
                      name='otherExemptionsOldRegime'
                      label="Other valid exemptions in Taxable Income (In Old Regime)" 
                      rules={amountRules}
                      hasFeedback
                    >
                      <Input placeholder="Other valid exemptions in Taxable Income (In Old Regime)" />
                    </Form.Item>
                    <Form.Item
                      name='otherExemptionsNewRegime'
                      label="Other valid exemptions in Taxable Income (In New Regime)" 
                      rules={amountRules}
                      hasFeedback
                    >
                      <Input placeholder="Other valid exemptions in Taxable Income (In New Regime)" />
                    </Form.Item>
                  </Card>
                  
                  <Form.Item {...buttonItemLayout}>
                    <Button 
                      type="primary"
                      htmlType='submit'
                      disabled={currentStep!==1}
                      style={buttonStyle}
                    >
                      Submit Investment Details
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </React.Fragment>
          }
        />
        <Step 
          title={<h5 ref={resultStepRef}>Calculations, Analysis and Verdicts</h5>}
          description={currentStep===2 &&
            <React.Fragment>
              { areValidInputsPresent
                  ? <Collapse defaultActiveKey={"1"} ghost>
                      <Panel header={<h6 style={{padding: '3px 0px'}}>Calculating Slab-wise Income Tax</h6>} key="1">
                        <Card style={resultCardStyle}>
                          <Table 
                            columns={columns()} 
                            dataSource={taxTableData()}
                            summary={ rows => {
                              let totalIncome = 0;
                              let totalTaxInOldRegime = 0;
                              let totalTaxInNewRegime = 0;
                      
                              rows.forEach(({ incomeInSlab, oldTax, newTax }) => {
                                totalIncome += numerize(incomeInSlab);
                                totalTaxInOldRegime += numerize(oldTax);
                                totalTaxInNewRegime += numerize(newTax);
                              });
                      
                              return (
                                <>
                                  <Table.Summary.Row style={{backgroundColor: '#fbfbfb'}}>
                                    <Table.Summary.Cell> <Text strong style={{float: 'right'}}> Total Taxable Income: </Text> </Table.Summary.Cell>
                                    <Table.Summary.Cell>
                                      <Text>{beautifyNumber(totalIncome)}/- ({capitalize(inWords(totalIncome))})</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell> <Text strong style={{float: 'right'}}> Total Income Tax in Old Regime: </Text> </Table.Summary.Cell>
                                    <Table.Summary.Cell>
                                      <Text>{beautifyNumber(totalTaxInOldRegime)}/- ({capitalize(inWords(totalTaxInOldRegime))})</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell> <Text strong style={{float: 'right'}}> Total Income Tax in New Regime: </Text> </Table.Summary.Cell>
                                    <Table.Summary.Cell>
                                      <Text>{beautifyNumber(totalTaxInNewRegime)}/- ({capitalize(inWords(totalTaxInNewRegime))})</Text>
                                    </Table.Summary.Cell>
                                  </Table.Summary.Row>
                                </>
                              );
                            }}
                            pagination={false}
                          />
                        </Card>
                      </Panel>
                      <Panel header={<h6 style={{padding: '3px 0px'}}>Calculating Exemptions in Taxable Income</h6>} key="2">
                        <Card style={resultCardStyle}>
                          <Tabs defaultActiveKey="1">
                            <TabPane tab="HRA" key="1">
                              <div style={textDivStyle}>
                                <h6>Total exemption under HRA = {beautifyNumber(_path(['currentHraExemption'], hra))}/- </h6>
                                <Divider />
                                <Paragraph>
                                  Calculated as, <strong>Minimum(x, y, z)</strong>, where:<br />
                                  x = HRA component of the salary = {beautifyNumber(_path(['hraComponent'], hra))}/-<br />
                                  y = {beautifyNumber(_path(['basicMultiplier'], hra)*100)}% of the Basic Salary = {beautifyNumber(_path(['factorOfBasic'], hra))}/-<br />
                                  z = Annual rent - 10% of Basic Salary = {beautifyNumber(_path(['currentRentLessBasic'], hra))}/-<br />
                                </Paragraph>
                              </div>
                            </TabPane>
                            <TabPane tab="80C" key="2">
                              <div style={textDivStyle}>
                                <h6>Total exemption under Section 80C = {beautifyNumber(_path(['current80cExemption'], sec80c))}/- </h6>
                                <Divider />
                                <Paragraph>
                                  Calculated as, <strong>x + y</strong>, where:<br />
                                  x = Employee's share of the Provident Fund = {beautifyNumber(_path(['pf80c'], sec80c))}/-<br />
                                  y = Other Investments under 80C = {beautifyNumber(_path(['other80c'], sec80c))}/-<br />
                                </Paragraph>
                              </div>
                            </TabPane>
                            <TabPane tab="80D" key="3">
                              Content of Tab Pane 3
                            </TabPane>
                            <TabPane tab="NPS" key="4">
                              Content of Tab Pane 3
                            </TabPane>
                            <TabPane tab="Others" key="5">
                              Content of Tab Pane 3
                            </TabPane>
                          </Tabs>
                        </Card>
                      </Panel>
                      <Panel header={<h6 style={{padding: '3px 0px'}}>Comparing Old and New Regimes</h6>} key="3">
                        <Card style={resultCardStyle}>
                          <Tabs defaultActiveKey="1">
                            <TabPane tab="HRA" key="1">
                              Content of Tab Pane 1
                            </TabPane>
                            <TabPane tab="80C" key="2">
                              Content of Tab Pane 2
                            </TabPane>
                            <TabPane tab="80D" key="3">
                              Content of Tab Pane 3
                            </TabPane>
                            <TabPane tab="NPS" key="4">
                              Content of Tab Pane 3
                            </TabPane>
                            <TabPane tab="Others" key="5">
                              Content of Tab Pane 3
                            </TabPane>
                          </Tabs>
                        </Card>
                      </Panel>
                    </Collapse>
                  : <span style={{color: 'red'}}>You need to enter the Salary Details atleast!</span>
              }
            </React.Fragment>
          } 
        />
      </Steps>
    </React.Fragment>
  );
};

export default TaxAssistant;
