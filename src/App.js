import './App.css';
import React, { useState } from 'react';
import { Layout, Menu, Steps, Divider, Form, Input, Button, Radio } from 'antd';
import { 
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  RobotOutlined,
  ReadOutlined,
} from '@ant-design/icons';

import logo from './logo.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import TaxAssistant from './components/TaxAssistant';

const { Header, Footer, Sider, Content } = Layout;
const { Step } = Steps;
const menuItems = {
  TaxAssistant   : 'TaxAssistant',
  ReadingMaterial: 'ReadingMaterial',
  AboutMe        : 'Aboutme',
};

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentItem, setCurrentItem] = useState(menuItems.TaxAssistant);
  const toggle = () => setIsCollapsed(!isCollapsed);

  return (
    <Layout>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={isCollapsed}
      >
        <img src={logo} className="logo" alt="logo" />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1" icon={<RobotOutlined />} onClick={() => setCurrentItem(menuItems.TaxAssistant)}>
            Tax Assistant
          </Menu.Item>
          <Menu.Item key="2" icon={<ReadOutlined />} onClick={() => setCurrentItem(menuItems.ReadingMaterial)}>
            Reading Material
          </Menu.Item>
          <Menu.Item key="3" icon={<UserOutlined />} onClick={() => setCurrentItem(menuItems.AboutMe)}>
            About me
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0 }}>
          <div className='row'>
            <div className='col-sm-1'>
              { 
                React.createElement(
                  isCollapsed 
                    ? MenuUnfoldOutlined 
                    : MenuFoldOutlined, 
                  {
                    className: 'trigger',
                    onClick: toggle,
                  }
                )
              }
            </div>
            <div className='col-sm-11'>
              <h3 className='header'>Personal Finance Toolbox</h3>
            </div>
          </div>
        </Header>
        <Content
          className="site-layout-background"
          style={{
            margin: '24px 0px 0px 0px',
            padding: 30,  
            minHeight: '100vh',
          }}
        >
          {currentItem===menuItems.TaxAssistant && <TaxAssistant />}
        </Content>
        <Footer style={{ textAlign: 'center' }}>Personal Finance Toolbox ©2022 Created by <a href='https://www.linkedin.com/in/mayank-kumar-giri/'>Mayank Kumar Giri</a></Footer>
      </Layout>
    </Layout>
  );
}

export default App;
