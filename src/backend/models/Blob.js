const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Blob = sequelize.define('Blob', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    blob_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type: logo, receipt_header, receipt_footer, product_image, employee_photo, customer_avatar, document, signature'
    },
    blob_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    blob_data: {
      type: DataTypes.BLOB('long'),
      allowNull: false,
      comment: 'Binary image data stored in BYTEA column'
    },
    blob_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'File size in bytes'
    },
    mime_type: {
      type: DataTypes.STRING(100),
      comment: 'MIME type: image/png, image/jpeg, image/webp'
    },
    width: {
      type: DataTypes.INTEGER,
      comment: 'Image width in pixels'
    },
    height: {
      type: DataTypes.INTEGER,
      comment: 'Image height in pixels'
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }
  }, {
    tableName: 'blobs',
    timestamps: true,
    createdAt: 'uploaded_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_blobs_type',
        fields: ['blob_type']
      },
      {
        name: 'idx_blobs_uploaded_by',
        fields: ['uploaded_by']
      }
    ]
  });

  return Blob;
};
