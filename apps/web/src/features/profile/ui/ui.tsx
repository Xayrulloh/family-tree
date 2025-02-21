import * as userModel from '../../users/model'
import { useEffect, useRef, useState } from 'react';
import { useUnit } from 'effector-react';
import { Typography, Avatar, Input, Select, DatePicker, Button, message, Upload } from 'antd';
import { UserGenderEnum, UserResponseType } from '@family-tree/shared';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { Option } = Select;

export const Profile: React.FC = () => {
  const fetchUser = useUnit(userModel.fetchUserFx);
  const user = useUnit(userModel.$user);

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);

  // State for editable fields
  const [editedUser, setEditedUser] = useState<UserResponseType | null>(null);

  // State for image file
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Ref to store the original user data for comparison
  const originalUserRef = useRef<UserResponseType | null>(null)

  // Fetch user data on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Initialize editedUser when user data is loaded
  useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = (field: keyof UserResponseType, value: string | dayjs.Dayjs) => {
    if (editedUser) {
      setEditedUser({
        ...editedUser,
        [field]: value,
      });
    }
  };

  // Handle image upload
  const handleImageUpload = (file: File) => {
    setImageFile(file);
    return false; // Prevent default upload behavior
  };

  // Check if user data has changed
  const hasChanges = () => {
    if (!editedUser || !originalUserRef.current) return false;

    // Compare each field
    const fields: (keyof UserResponseType)[] = ['name', 'gender', 'birthdate', 'deathdate'];

    for (const field of fields) {
      if (editedUser[field] !== originalUserRef.current[field]) {
        return true;
      }
    }

    // Check if a new image has been uploaded
    if (imageFile) {
      return true;
    }

    return false;
  };

// Handle save
const handleSave = async () => {
  if (!editedUser || !hasChanges()) {
    message.info('No changes to save');
    return;
  }

  try {
    const imageUrl = editedUser.image;

    // Upload image to Cloudflare R2 if a new image is selected
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);

      console.log('Uploading image...');
      // upload file
      // const uploadResponse = await fetch('/api/upload-image', {
      //   method: 'POST',
      //   body: formData,
      // });

      // if (!uploadResponse.ok) {
      //   throw new Error('Failed to upload image');
      // }

      // const { url } = await uploadResponse.json();
      // imageUrl = url;
    }

    // Prepare the updated user data
    const updatedUser = {
      ...editedUser,
      image: imageUrl,
    };

    // Send PUT request to update user data
    const updateResponse = await fetch('/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedUser),
      credentials: 'include',
    });

    if (updateResponse.status === 204) {
      message.success('Profile updated successfully');
      setIsEditing(false);
      fetchUser(); // Refetch user data to update the UI
    } else {
      throw new Error('Failed to update profile');
    }
  } catch (error) {
    message.error('Failed to update profile');
    console.error(error);
  }
};

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(originalUserRef.current); // Reset to original user data
    setImageFile(null); // Clear the uploaded image
  };

  if (!user || !editedUser) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className="home-profile"
      style={{
        backgroundColor: 'green',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '600px',
        width: '600px',
        borderRadius: '8px',
        marginTop: '30px',
      }}
    >
      {/* Avatar */}
      {isEditing ? (
        <Upload
          beforeUpload={handleImageUpload}
          showUploadList={false}
          accept="image/*"
        >
          <Avatar size={200} src={imageFile ? URL.createObjectURL(imageFile) : editedUser.image} />
        </Upload>
      ) : (
        <Avatar size={200} src={editedUser.image || ''} />
      )}

      {/* Editable Fields */}
      <div style={{ marginTop: '40px', paddingTop: '20px' }}>
        {/* Name */}
        {isEditing ? (
          <Input
            value={editedUser.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <Title style={{ color: 'white' }}>Name: {editedUser.name}</Title>
        )}

        {/* Email (Non-editable) */}
        <Paragraph style={{ color: 'white' }}>Email: {editedUser.email}</Paragraph>

        {/* Gender */}
        {isEditing ? (
          <Select
            value={editedUser.gender}
            onChange={(value) => handleInputChange('gender', value)}
            style={{ width: '100%', marginBottom: '16px' }}
          >
            <Option value={UserGenderEnum.UNKNOWN}>Unknown</Option>
            <Option value={UserGenderEnum.MALE}>Male</Option>
            <Option value={UserGenderEnum.FEMALE}>Female</Option>
          </Select>
        ) : (
          <Paragraph style={{ color: 'white' }}>Gender: {editedUser.gender}</Paragraph>
        )}

        {/* Birthdate */}
        {isEditing ? (
          <DatePicker
            value={editedUser.birthdate ? dayjs(editedUser.birthdate) : null}
            onChange={(date) => handleInputChange('birthdate', date ? date.format('YYYY-MM-DD') : '')}
            style={{ width: '100%', marginBottom: '16px' }}
          />
        ) : (
          <Paragraph style={{ color: 'white' }}>
            Birthdate: {editedUser.birthdate || 'UNKNOWN'}
          </Paragraph>
        )}

        {/* Deathdate */}
        {isEditing ? (
          <DatePicker
            value={editedUser.deathdate ? dayjs(editedUser.deathdate) : null}
            onChange={(date) => handleInputChange('deathdate', date ? date.format('YYYY-MM-DD') : '')}
            style={{ width: '100%', marginBottom: '16px' }}
          />
        ) : (
          <Paragraph style={{ color: 'white' }}>
            Deathdate: {editedUser.deathdate || 'UNKNOWN'}
          </Paragraph>
        )}
      </div>

      {/* Buttons */}
      {isEditing ? (
        <div>
          <Button type="primary" onClick={handleSave} style={{ marginRight: '8px' }}>
            Save
          </Button>
          <Button onClick={handleCancel}>Cancel</Button>
        </div>
      ) : (
        <Button type="primary" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      )}
    </div>
  );
};
