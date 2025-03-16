import React, { useEffect, useState } from 'react';
import { Typography, Card, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { FamilyTreeArrayResponseType } from '@family-tree/shared';

const { Title } = Typography;

export const FamilyTree: React.FC = () => {
  const [familyTrees, setFamilyTrees] = useState<FamilyTreeArrayResponseType>([]);

  // Fetch family trees from the API
  useEffect(() => {
    const fetchFamilyTrees = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/family-trees`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch family trees');
        }

        const data = await response.json();
        setFamilyTrees(data);
      } catch (error) {
        message.error('Failed to load family trees');
        console.error(error);
      }
    };

    fetchFamilyTrees();
  }, []);

  // Handle click on a family tree square
  const handleFamilyTreeClick = (id: string) => {
    window.location.href = `/family-tree/detail/${id}`;
  };

  // Handle click on "Create a new one" button
  const handleCreateNew = () => {
    window.location.href = '/family-tree/create';
  };

  return (
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <Title level={2}>My Family Trees</Title>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', // Dynamic columns
          gridTemplateRows: 'repeat(2, 1fr)', // Fixed 2 rows
          gridAutoFlow: 'column', // Force horizontal flow
          gap: '16px',
          width: '80%', // Set a fixed width for the grid container
          maxWidth: '1200px', // Optional: Limit maximum width
        }}
      >
        {/* "Create a new one" square */}
        <Card
          hoverable
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            backgroundColor: '#f0f2f5',
          }}
          onClick={handleCreateNew}
        >
          <PlusOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
          <p style={{ marginTop: '8px', color: '#1890ff' }}>Create a new one</p>
        </Card>

        {/* Family tree squares */}
        {familyTrees.map((tree) => (
          <Card
            key={tree.id}
            hoverable
            cover={
              tree.image ? (
                <img
                  alt={tree.name}
                  src={tree.image}
                  style={{ height: '150px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    height: '150px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#f0f2f5',
                  }}
                >
                  <p>No Image</p>
                </div>
              )
            }
            onClick={() => handleFamilyTreeClick(tree.id)}
          >
            <Card.Meta title={tree.name} style={{ textAlign: 'center' }} />
          </Card>
        ))}
      </div>
    </div>
  );
};