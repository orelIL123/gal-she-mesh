import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    addGalleryImage,
    addShopItem,
    deleteGalleryImage,
    deleteShopItem,
    GalleryImage,
    getGalleryImages,
    getShopItems,
    initializeGalleryImages,
    ShopItem,
    updateShopItem,
    uploadImageToStorage
} from '../../services/firebase';
import ToastMessage from '../components/ToastMessage';
import TopNav from '../components/TopNav';

const { width } = Dimensions.get('window');

interface AdminGalleryScreenProps {
  onNavigate?: (screen: string) => void;
  onBack?: () => void;
  initialTab?: 'gallery' | 'background' | 'splash' | 'aboutus' | 'shop' | 'treatments';
}


const AdminGalleryScreen: React.FC<AdminGalleryScreenProps> = ({ onNavigate, onBack, initialTab }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [shopModalVisible, setShopModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'gallery' | 'background' | 'splash' | 'aboutus' | 'shop' | 'treatments'>(initialTab || 'gallery');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    imageUrl: '',
    type: 'gallery' as 'gallery' | 'background' | 'splash' | 'aboutus' | 'treatments',
    order: '0'
  });

  // Shop state
  const [shopProducts, setShopProducts] = useState<ShopItem[]>([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopForm, setShopForm] = useState({ 
    name: '', 
    description: '',
    price: '', 
    category: '',
    imageUrl: '', 
    stock: '',
    editingId: null as string | null
  });


  // Add state for about us text
  const [aboutUsText, setAboutUsText] = useState('ברוכים הבאים ל־torix – מספרה משפחתית עם יחס אישי, מקצועיות ואווירה חמה. נשמח לראותכם!');
  const [editingAboutUs, setEditingAboutUs] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    if (selectedTab === 'shop') {
      fetchShopProducts();
    }
  }, [selectedTab]);

  // Load about us text from Firestore
  useEffect(() => {
    const fetchAboutUsText = async () => {
      try {
        const db = getFirestore();
        const docRef = doc(db, 'settings', 'aboutUsText');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setAboutUsText(snap.data().text || aboutUsText);
        }
      } catch (e) { /* ignore */ }
    };
    fetchAboutUsText();
  }, []);

  // Save about us text to Firestore
  const saveAboutUsText = async () => {
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'settings', 'aboutUsText'), { text: aboutUsText });
      setEditingAboutUs(false);
      showToast('הטקסט עודכן!');
    } catch (e) {
      showToast('שגיאה בעדכון הטקסט', 'error');
    }
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      let imagesData = await getGalleryImages();

      if (!imagesData || imagesData.length === 0) {
        try {
          console.log('📷 No gallery images found, initializing defaults from Firebase...');
          await initializeGalleryImages();
          imagesData = await getGalleryImages();
        } catch (initError) {
          console.error('Error initializing gallery images:', initError);
          showToast('שגיאה בטעינת גלריה, נסה שוב מאוחר יותר', 'error');
        }
      }

      // Load atmosphere and aboutus images from settings and add them to gallery if they don't exist
      try {
        const db = getFirestore();
        const settingsDocRef = doc(db, 'settings', 'images');
        const settingsDocSnap = await getDoc(settingsDocRef);
        
        if (settingsDocSnap.exists()) {
          const settingsData = settingsDocSnap.data();
          const atmosphereImage = settingsData.atmosphereImage;
          const aboutUsImage = settingsData.aboutUsImage;
          
          // Check if background image exists in gallery, if not add it
          if (atmosphereImage) {
            const backgroundExists = imagesData.some(img => 
              img.type === 'background' && img.imageUrl === atmosphereImage
            );
            if (!backgroundExists) {
              // Add background image to gallery if it doesn't exist
              const backgroundImageId = await addGalleryImage({
                imageUrl: atmosphereImage,
                type: 'background',
                order: 0,
                isActive: true
              });
              imagesData.push({
                id: backgroundImageId,
                imageUrl: atmosphereImage,
                type: 'background',
                order: 0,
                isActive: true,
                createdAt: new Date() as any
              });
              console.log('✅ Added background image from settings to gallery');
            }
          }
          
          // Check if aboutus image exists in gallery, if not add it
          if (aboutUsImage) {
            const aboutUsExists = imagesData.some(img => 
              img.type === 'aboutus' && img.imageUrl === aboutUsImage
            );
            if (!aboutUsExists) {
              // Add aboutus image to gallery if it doesn't exist
              const aboutUsImageId = await addGalleryImage({
                imageUrl: aboutUsImage,
                type: 'aboutus',
                order: 0,
                isActive: true
              });
              imagesData.push({
                id: aboutUsImageId,
                imageUrl: aboutUsImage,
                type: 'aboutus',
                order: 0,
                isActive: true,
                createdAt: new Date() as any
              });
              console.log('✅ Added aboutus image from settings to gallery');
            }
          }
        }
      } catch (settingsError) {
        console.error('Error loading settings images:', settingsError);
      }

      setImages(imagesData);
    } catch (error) {
      console.error('Error loading images:', error);
      showToast('שגיאה בטעינת התמונות', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Fix permissions by migrating custom claims and refreshing token

  const openAddModal = (type: 'gallery' | 'background' | 'splash' | 'aboutus' | 'treatments') => {
    setEditingImage(null);
    setFormData({
      imageUrl: '',
      type,
      order: '0'
    });
    setModalVisible(true);
  };

  const openEditModal = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      imageUrl: image.imageUrl,
      type: image.type,
      order: image.order.toString()
    });
    setModalVisible(true);
  };

  const pickImageFromDevice = async (): Promise<{ uri: string; mimeType?: string } | null> => {
    try {
      console.log('📱 Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showToast('נדרשת הרשאה לגישה לגלריה', 'error');
        return null;
      }

      // Double check permission status
      if (permissionResult.status !== 'granted') {
        showToast('הרשאת גישה נדחתה', 'error');
        return null;
      }

      console.log('📱 Permissions granted, launching image picker...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5, // Reduced quality to save space - especially for shop images
      });

      console.log('📱 Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.uri;
        const mimeType = asset.mimeType || 'image/jpeg';
        console.log('📤 Selected image URI:', imageUri);
        console.log('📄 MIME type:', mimeType);
        return { uri: imageUri, mimeType };
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('שגיאה בבחירת התמונה', 'error');
    }
    return null;
  };

  const uploadImageFromDevice = async () => {
    // בדוק אם זה tab של תמונות
    if (!isImageTab(selectedTab)) {
      showToast('אפשר להעלות תמונות רק בטאבים של תמונות', 'error');
      return;
    }

    // בדוק אם כבר מעלה תמונה
    if (isUploading) {
      return;
    }

    try {
      setIsUploading(true);
      
      // שלב 1: בחר תמונה מהטלפון
      const imageData = await pickImageFromDevice();
      if (!imageData) {
        setIsUploading(false);
        return;
      }

      showToast('מעלה תמונה...', 'success');
      
      // שלב 2: העלה את התמונה לשרת
      // Determine file extension from mimeType
      let extension = 'jpg';
      if (imageData.mimeType?.includes('png')) {
        extension = 'png';
      } else if (imageData.mimeType?.includes('webp')) {
        extension = 'webp';
      }
      
      const fileName = `img_${Date.now()}.${extension}`;
      const folderPath = 'gallery'; // תמיד gallery
      
      const downloadURL = await uploadImageToStorage(imageData.uri, folderPath, fileName, imageData.mimeType);
      
      // שלב 3: הוסף את התמונה לגלריה
      // הוסף תמונה חדשה לגלריה
      const imageDataToSave = {
        imageUrl: downloadURL,
        type: 'gallery', // תמיד gallery
        order: images.filter(img => img.type === 'gallery').length, // הוסף בסוף
        isActive: true
      };

      console.log('📝 Adding new image to gallery:', imageDataToSave);
      const newImageId = await addGalleryImage(imageDataToSave);
      console.log('✅ Image added to gallery with ID:', newImageId);
      
      // עדכן את ה-state המקומי
      setImages(prev => [...prev, { id: newImageId, ...imageDataToSave, createdAt: new Date() as any }]);
      
      // שלב 4: הצג הודעה
      showToast('התמונה הועלתה בהצלחה! 🎉', 'success');
      
      // רענן תמונות
      const refreshedImages = await getGalleryImages();
      setImages(refreshedImages);
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      // Show the real error details so we know exactly what failed
      Alert.alert(
        'שגיאה בהעלאת התמונה',
        `code: ${error?.code || 'unknown'}\nmessage: ${error?.message || JSON.stringify(error)}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    if (!formData.imageUrl.trim()) {
      showToast('נא להזין קישור לתמונה', 'error');
      return false;
    }
    
    // Basic URL validation
    try {
      new URL(formData.imageUrl);
    } catch {
      showToast('נא להזין קישור תקין', 'error');
      return false;
    }

    if (isNaN(Number(formData.order))) {
      showToast('נא להזין מספר סדר תקין', 'error');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      console.log('🔄 Saving image to Firebase...', formData);
      
      const imageUrl = formData.imageUrl.trim();
      
      if (editingImage) {
        // Update existing image
        const imageData = {
          imageUrl: imageUrl,
          type: formData.type,
          order: parseInt(formData.order),
          isActive: true
        };

        console.log('📝 Updating image:', editingImage.id, imageData);
        
        // Update in Firebase using updateDoc instead of addDoc
        const { updateDoc, doc, setDoc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../config/firebase');
        
        await updateDoc(doc(db, 'gallery', editingImage.id), imageData);
        
        // If background or aboutus, also update settings/images
        if (formData.type === 'background') {
          const settingsRef = doc(db, 'settings', 'images');
          const settingsSnap = await getDoc(settingsRef);
          const currentData = settingsSnap.exists() ? settingsSnap.data() : {};
          await setDoc(settingsRef, {
            ...currentData,
            atmosphereImage: imageUrl
          }, { merge: true });
          console.log('✅ Updated atmosphereImage in settings');
        } else if (formData.type === 'aboutus') {
          const settingsRef = doc(db, 'settings', 'images');
          const settingsSnap = await getDoc(settingsRef);
          const currentData = settingsSnap.exists() ? settingsSnap.data() : {};
          await setDoc(settingsRef, {
            ...currentData,
            aboutUsImage: imageUrl
          }, { merge: true });
          console.log('✅ Updated aboutUsImage in settings');
        }
        
        // Update in local state
        setImages(prev => prev.map(img => 
          img.id === editingImage.id 
            ? { ...img, ...imageData }
            : img
        ));
        
        showToast('התמונה עודכנה בהצלחה');
        console.log('✅ Image updated successfully');
      } else {
        // Add new image
        // Check if single image restriction applies
        if (formData.type !== 'gallery') {
          const existingImages = images.filter(img => img.type === formData.type);
          if (existingImages.length > 0) {
            showToast(`יכולה להיות רק תמונה אחת עבור ${getTabTitle(formData.type)}`, 'error');
            return;
          }
        }

        const imageData = {
          imageUrl: imageUrl,
          type: formData.type,
          order: parseInt(formData.order),
          isActive: true
        };

        console.log('📝 Adding new image:', imageData);
        const newImageId = await addGalleryImage(imageData);
        console.log('✅ Image saved with ID:', newImageId);
        
        // If background or aboutus, also update settings/images
        if (formData.type === 'background') {
          const { setDoc, doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../../config/firebase');
          const settingsRef = doc(db, 'settings', 'images');
          const settingsSnap = await getDoc(settingsRef);
          const currentData = settingsSnap.exists() ? settingsSnap.data() : {};
          await setDoc(settingsRef, {
            ...currentData,
            atmosphereImage: imageUrl
          }, { merge: true });
          console.log('✅ Updated atmosphereImage in settings');
        } else if (formData.type === 'aboutus') {
          const { setDoc, doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../../config/firebase');
          const settingsRef = doc(db, 'settings', 'images');
          const settingsSnap = await getDoc(settingsRef);
          const currentData = settingsSnap.exists() ? settingsSnap.data() : {};
          await setDoc(settingsRef, {
            ...currentData,
            aboutUsImage: imageUrl
          }, { merge: true });
          console.log('✅ Updated aboutUsImage in settings');
        }
        
        setImages(prev => [...prev, { id: newImageId, ...imageData, createdAt: new Date() as any }]);
        showToast('התמונה נוספה בהצלחה');
      }
      
      setModalVisible(false);
      
      // Reset form
      setFormData({
        imageUrl: '',
        type: selectedTab as 'gallery' | 'background' | 'splash' | 'aboutus' | 'treatments',
        order: '0'
      });
      setEditingImage(null);
      
      // Refresh images from Firestore
      const refreshedImages = await getGalleryImages();
      setImages(refreshedImages);
      console.log('✅ Refreshed images, total count:', refreshedImages.length);
      console.log('✅ Background images:', refreshedImages.filter(img => img.type === 'background'));
      
    } catch (error) {
      console.error('Error saving image:', error);
      showToast('שגיאה בהוספת התמונה', 'error');
    }
  };

  const handleDelete = async (imageId: string) => {
    Alert.alert(
      'מחיקת תמונה',
      'האם אתה בטוח שברצונך למחוק תמונה זו?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get image data before deleting
              const imageToDelete = images.find(img => img.id === imageId);

              await deleteGalleryImage(imageId);
              setImages(prev => prev.filter(img => img.id !== imageId));

              // If deleting background or aboutus, also remove from settings
              if (imageToDelete) {
                if (imageToDelete.type === 'background') {
                  const { setDoc, doc, getDoc } = await import('firebase/firestore');
                  const { db } = await import('../../config/firebase');
                  const settingsRef = doc(db, 'settings', 'images');
                  const settingsSnap = await getDoc(settingsRef);
                  const currentData = settingsSnap.exists() ? settingsSnap.data() : {};
                  await setDoc(settingsRef, {
                    ...currentData,
                    atmosphereImage: ''
                  }, { merge: true });
                  console.log('✅ Removed atmosphereImage from settings');
                } else if (imageToDelete.type === 'aboutus') {
                  const { setDoc, doc, getDoc } = await import('firebase/firestore');
                  const { db } = await import('../../config/firebase');
                  const settingsRef = doc(db, 'settings', 'images');
                  const settingsSnap = await getDoc(settingsRef);
                  const currentData = settingsSnap.exists() ? settingsSnap.data() : {};
                  await setDoc(settingsRef, {
                    ...currentData,
                    aboutUsImage: ''
                  }, { merge: true });
                  console.log('✅ Removed aboutUsImage from settings');
                }
              }

              showToast('התמונה נמחקה בהצלחה');
            } catch (error) {
              console.error('Error deleting image:', error);
              showToast('שגיאה במחיקת התמונה', 'error');
            }
          }
        }
      ]
    );
  };


  const handleMoveUp = async (image: GalleryImage) => {
    try {
      const currentImages = filteredImages.sort((a, b) => a.order - b.order);
      const currentIndex = currentImages.findIndex(img => img.id === image.id);
      
      if (currentIndex <= 0) {
        showToast('התמונה כבר במקום הראשון');
        return;
      }
      
      // Swap orders with the image above
      const imageAbove = currentImages[currentIndex - 1];
      const newOrder = imageAbove.order;
      const aboveNewOrder = image.order;
      
      // Update in Firebase
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../config/firebase');
      
      await Promise.all([
        updateDoc(doc(db, 'gallery', image.id), { order: newOrder }),
        updateDoc(doc(db, 'gallery', imageAbove.id), { order: aboveNewOrder })
      ]);
      
      // Update in local state
      setImages(prev => prev.map(img => {
        if (img.id === image.id) return { ...img, order: newOrder };
        if (img.id === imageAbove.id) return { ...img, order: aboveNewOrder };
        return img;
      }));
      
      showToast('הסדר עודכן');
      console.log(`Moved image ${image.id} up: ${image.order} -> ${newOrder}`);
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('שגיאה בעדכון הסדר', 'error');
    }
  };

  const handleMoveDown = async (image: GalleryImage) => {
    try {
      const currentImages = filteredImages.sort((a, b) => a.order - b.order);
      const currentIndex = currentImages.findIndex(img => img.id === image.id);
      
      if (currentIndex >= currentImages.length - 1) {
        showToast('התמונה כבר במקום האחרון');
        return;
      }
      
      // Swap orders with the image below
      const imageBelow = currentImages[currentIndex + 1];
      const newOrder = imageBelow.order;
      const belowNewOrder = image.order;
      
      // Update in Firebase
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../../config/firebase');
      
      await Promise.all([
        updateDoc(doc(db, 'gallery', image.id), { order: newOrder }),
        updateDoc(doc(db, 'gallery', imageBelow.id), { order: belowNewOrder })
      ]);
      
      // Update in local state
      setImages(prev => prev.map(img => {
        if (img.id === image.id) return { ...img, order: newOrder };
        if (img.id === imageBelow.id) return { ...img, order: belowNewOrder };
        return img;
      }));
      
      showToast('הסדר עודכן');
      console.log(`Moved image ${image.id} down: ${image.order} -> ${newOrder}`);
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('שגיאה בעדכון הסדר', 'error');
    }
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'gallery': return 'גלריה';
      case 'background': return 'רקע';
      case 'splash': return 'מסך טעינה';
      case 'aboutus': return 'אודותינו';
      case 'shop': return 'חנות';
      case 'treatments': return 'טיפולים';
      default: return tab;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'gallery': return 'images';
      case 'background': return 'image';
      case 'splash': return 'phone-portrait';
      case 'aboutus': return 'information-circle';
      case 'shop': return 'cart';
      case 'treatments': return 'cut';
      default: return 'image';
    }
  };

  const filteredImages = images.filter(img => img.type === selectedTab);

  const tabs = [
    { key: 'gallery', label: 'גלריה', icon: 'images' },
    { key: 'background', label: 'רקע', icon: 'image' },
    { key: 'splash', label: 'מסך טעינה', icon: 'phone-portrait' },
    { key: 'aboutus', label: 'אודותינו', icon: 'information-circle' },
    { key: 'treatments', label: 'טיפולים', icon: 'cut' },
    { key: 'shop', label: 'חנות', icon: 'cart' },
  ];

  // טען מוצרים מה-shop
  const fetchShopProducts = async () => {
    setShopLoading(true);
    try {
      const items = await getShopItems();
      setShopProducts(items);
    } catch (e) {
      showToast('שגיאה בטעינת מוצרים', 'error');
    } finally {
      setShopLoading(false);
    }
  };

  // העלאת תמונה ל-shop - משתמשת באותה לוגיקה שעובדת בגלריה
  const uploadShopImageFromDevice = async () => {
    if (isUploading) {
      showToast('מעלה תמונה, אנא המתן...', 'error');
      return;
    }

    try {
      setIsUploading(true);
      console.log('🔄 Starting shop image upload...');
      
      const imageData = await pickImageFromDevice();
      if (!imageData) {
        console.log('❌ No image selected');
        return;
      }

      console.log('📱 Image selected:', imageData.uri);
      showToast('מעלה תמונה...', 'success');
      
      // Determine file extension from mimeType
      let extension = 'jpg';
      if (imageData.mimeType?.includes('png')) {
        extension = 'png';
      } else if (imageData.mimeType?.includes('webp')) {
        extension = 'webp';
      }
      
      const fileName = `shop_${Date.now()}.${extension}`;
      console.log('📁 Uploading to shop folder with filename:', fileName);
      
      const downloadURL = await uploadImageToStorage(imageData.uri, 'shop', fileName, imageData.mimeType);
      console.log('✅ Upload successful, URL:', downloadURL);
      
      // עדכון ישיר של ה-state במקום החזרת URL
      setShopForm(f => ({ ...f, imageUrl: downloadURL }));
      
      showToast('התמונה הועלתה בהצלחה', 'success');
    } catch (error) {
      console.error('❌ Error uploading shop image:', error);
      showToast(`שגיאה בהעלאת התמונה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // שמירת מוצר חדש/ערוך
  const handleSaveShopProduct = async () => {
    if (!shopForm.name.trim() || !shopForm.price.trim() || !shopForm.imageUrl) {
      showToast('נא למלא שם, מחיר ותמונה', 'error');
      return;
    }
    setShopLoading(true);
    try {
      if (shopForm.editingId) {
        await updateShopItem(shopForm.editingId, {
          name: shopForm.name.trim(),
          description: shopForm.description.trim(),
          price: Number(shopForm.price),
          category: shopForm.category.trim(),
          imageUrl: shopForm.imageUrl,
          stock: shopForm.stock ? Number(shopForm.stock) : undefined,
          isActive: true
        });
        showToast('המוצר עודכן!');
      } else {
        await addShopItem({
          name: shopForm.name.trim(),
          description: shopForm.description.trim(),
          price: Number(shopForm.price),
          category: shopForm.category.trim(),
          imageUrl: shopForm.imageUrl,
          stock: shopForm.stock ? Number(shopForm.stock) : undefined,
          isActive: true
        });
        showToast('המוצר נוסף!');
      }
      setShopForm({ 
        name: '', 
        description: '',
        price: '', 
        category: '',
        imageUrl: '', 
        stock: '',
        editingId: null 
      });
      fetchShopProducts();
    } catch (e) {
      showToast('שגיאה בשמירת מוצר', 'error');
    } finally {
      setShopLoading(false);
    }
  };

  // מחיקת מוצר
  const handleDeleteShopProduct = async (id: string) => {
    setShopLoading(true);
    try {
      await deleteShopItem(id);
      showToast('המוצר נמחק!');
      fetchShopProducts();
    } catch (e) {
      showToast('שגיאה במחיקת מוצר', 'error');
    } finally {
      setShopLoading(false);
    }
  };


  // Fix openAddModal and getTabTitle calls to only use the original image tabs
  const isImageTab = (tab: string): tab is 'gallery' | 'background' | 'splash' | 'aboutus' | 'treatments' =>
    tab === 'gallery' || tab === 'background' || tab === 'splash' || tab === 'aboutus' || tab === 'treatments';


  return (
    <SafeAreaView style={styles.container}>
      <TopNav 
        title="ניהול הגלריה"
        onBellPress={() => {}}
        onMenuPress={() => {}}
        showBackButton={true}
        onBackPress={onBack || (() => onNavigate?.('admin-home'))}
      />
      
      <View style={styles.content}>
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                selectedTab === tab.key && styles.activeTab
              ]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={selectedTab === tab.key ? '#007bff' : '#666'} 
              />
              <Text style={[
                styles.tabText,
                selectedTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add Image Button */}
        <View style={styles.header}>
          {selectedTab === 'shop' ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setShopForm({
                  name: '',
                  description: '',
                  price: '',
                  category: '',
                  imageUrl: '',
                  stock: '',
                  editingId: null
                });
                setShopModalVisible(true);
              }}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addButtonText}>הוסף מוצר חדש</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.uploadButton,
                isUploading && styles.uploadButtonDisabled
              ]}
              onPress={uploadImageFromDevice}
              disabled={isUploading}
            >
              <Ionicons name="phone-portrait" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>
                {isUploading ? 'מעלה...' : 'העלה תמונה מהטלפון'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Images Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>טוען תמונות...</Text>
          </View>
        ) : (
          <ScrollView style={styles.imagesList}>
            {/* Gallery Images */}
            {filteredImages.length > 0 && (
              <View style={styles.section}>
                <View style={styles.imagesGrid}>
                  {filteredImages.map((image) => (
                    <View key={image.id} style={styles.imageCard}>
                      <Image
                        source={{ uri: image.imageUrl }}
                        style={styles.imagePreview}
                        defaultSource={{ uri: 'https://via.placeholder.com/200x150' }}
                      />
                      <View style={styles.imageInfo}>
                        <Text style={styles.imageOrder}>סדר: {image.order}</Text>
                        <Text style={styles.imageStatus}>{image.isActive ? 'פעיל' : 'לא פעיל'}</Text>
                      </View>
                      <View style={styles.imageActions}>
                        <TouchableOpacity 
                          style={styles.actionButtonSmall}
                          onPress={() => handleMoveUp(image)}
                        >
                          <Ionicons name="chevron-up" size={18} color="#007bff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButtonSmall}
                          onPress={() => handleMoveDown(image)}
                        >
                          <Ionicons name="chevron-down" size={18} color="#007bff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButtonSmall, { backgroundColor: 'rgba(40, 167, 69, 0.1)' }]}
                          onPress={() => openEditModal(image)}
                        >
                          <Ionicons name="create" size={18} color="#28a745" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButtonSmall, { backgroundColor: 'rgba(220, 53, 69, 0.1)' }]}
                          onPress={() => handleDelete(image.id)}
                        >
                          <Ionicons name="trash" size={18} color="#dc3545" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Empty State */}
            {filteredImages.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name={getTabIcon(selectedTab) as any} size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>אין תמונות ב{getTabTitle(selectedTab)}</Text>
                <TouchableOpacity 
                  style={styles.emptyAddButton} 
                  onPress={() => openAddModal(selectedTab === 'shop' ? 'gallery' : selectedTab)}
                >
                  <Text style={styles.emptyAddButtonText}>הוסף תמונה ראשונה</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Add Image Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingImage ? 'עריכת תמונה' : `הוספת תמונה ל${getTabTitle(formData.type)}`}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {editingImage && (
                <View style={styles.editingInfo}>
                  <Text style={styles.editingInfoText}>
                    🔧 עריכת תמונה - סדר נוכחי: {editingImage.order}
                  </Text>
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>תמונה</Text>
                
                {/* Upload from device button */}
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={uploadImageFromDevice}
                >
                  <Ionicons name="cloud-upload" size={20} color="#007bff" />
                  <Text style={styles.uploadButtonText}>
                    {editingImage ? 'החלף תמונה מהמכשיר' : 'העלה תמונה מהמכשיר'}
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.orText}>או</Text>
                
                {/* URL input */}
                <TextInput
                  style={styles.textInput}
                  value={formData.imageUrl}
                  onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                  placeholder="https://example.com/image.jpg"
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>סדר תצוגה</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.order}
                  onChangeText={(text) => setFormData({ ...formData, order: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  textAlign="right"
                />
                <Text style={styles.inputHint}>
                  תמונות עם מספר נמוך יותר יופיעו קודם
                </Text>
              </View>

              {/* Image Preview */}
              {formData.imageUrl && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>תצוגה מקדימה</Text>
                  <Image
                    source={{ uri: formData.imageUrl }}
                    style={styles.previewImage}
                    defaultSource={{ uri: 'https://via.placeholder.com/200x150' }}
                  />
                </View>
              )}

              <View style={styles.guidelinesContainer}>
                <Text style={styles.guidelinesTitle}>הנחיות לתמונות:</Text>
                <Text style={styles.guideline}>• יחס גובה-רוחב מומלץ: 4:3</Text>
                <Text style={styles.guideline}>• רזולוציה מינימלית: 800x600</Text>
                <Text style={styles.guideline}>• פורמטים נתמכים: JPG, PNG</Text>
                <Text style={styles.guideline}>• גודל קובץ מקסימלי: 5MB</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={() => {
                  console.log('💾 Save button pressed in AdminGalleryScreen');
                  handleSave();
                }}
              >
                <Text style={styles.saveButtonText}>
                  {editingImage ? 'עדכן תמונה' : 'הוסף תמונה'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {selectedTab === 'shop' && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={shopModalVisible}
          onRequestClose={() => setShopModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {shopForm.editingId ? 'עריכת מוצר' : 'הוספת מוצר חדש'}
                </Text>
                <TouchableOpacity onPress={() => setShopModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>שם המוצר</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shopForm.name}
                    onChangeText={text => setShopForm(f => ({ ...f, name: text }))}
                    placeholder="שם המוצר"
                    placeholderTextColor="#aaa"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>תיאור</Text>
                  <TextInput
                    style={[styles.textInput, { height: 80 }]}
                    value={shopForm.description}
                    onChangeText={text => setShopForm(f => ({ ...f, description: text }))}
                    placeholder="תיאור המוצר"
                    placeholderTextColor="#aaa"
                    multiline
                    textAlign="right"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>קטגוריה</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shopForm.category}
                    onChangeText={text => setShopForm(f => ({ ...f, category: text }))}
                    placeholder="קטגוריה (למשל: שמפו, מוצרי טיפוח)"
                    placeholderTextColor="#aaa"
                    textAlign="right"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>מחיר</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shopForm.price}
                    onChangeText={text => setShopForm(f => ({ ...f, price: text }))}
                    keyboardType="numeric"
                    placeholder="מחיר"
                    placeholderTextColor="#aaa"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>מלאי (אופציונלי)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shopForm.stock}
                    onChangeText={text => setShopForm(f => ({ ...f, stock: text }))}
                    keyboardType="numeric"
                    placeholder="כמות במלאי"
                    placeholderTextColor="#aaa"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>תמונה</Text>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={uploadShopImageFromDevice}
                  >
                    <Ionicons name="cloud-upload" size={20} color="#007bff" />
                    <Text style={styles.uploadButtonText}>
                      {shopForm.imageUrl ? 'החלף תמונה' : 'העלה תמונה'}
                    </Text>
                  </TouchableOpacity>
                  {shopForm.imageUrl ? (
                    <Image source={{ uri: shopForm.imageUrl }} style={{width:100,height:100,borderRadius:8,alignSelf:'center',marginBottom:8}} />
                  ) : null}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setShopModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>ביטול</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSaveShopProduct}
                  disabled={shopLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {shopForm.editingId ? 'עדכן מוצר' : 'הוסף מוצר'}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{marginTop:16,maxHeight:300}}>
                {shopProducts.map(prod => (
                  <View key={prod.id} style={{flexDirection:'row',alignItems:'center',backgroundColor:'#222',borderRadius:8,padding:8,marginBottom:8}}>
                    <Image source={{ uri: prod.imageUrl }} style={{width:60,height:60,borderRadius:8,marginRight:8}} />
                    <View style={{flex:1}}>
                      <Text style={{color:'#fff',fontWeight:'bold'}}>{prod.name}</Text>
                      <Text style={{color:'#aaa',fontSize:12}}>{prod.description}</Text>
                      <Text style={{color:'#fff'}}>{prod.price} ₪</Text>
                      <Text style={{color:'#aaa',fontSize:11}}>קטגוריה: {prod.category}</Text>
                      {prod.stock && <Text style={{color:'#aaa',fontSize:11}}>מלאי: {prod.stock}</Text>}
                    </View>
                    <TouchableOpacity onPress={()=>setShopForm({ 
                      name: prod.name, 
                      description: prod.description || '',
                      price: String(prod.price), 
                      category: prod.category || '',
                      imageUrl: prod.imageUrl, 
                      stock: prod.stock ? String(prod.stock) : '',
                      editingId: prod.id 
                    })} style={{marginHorizontal:4}}>
                      <Ionicons name="create-outline" size={24} color="#007bff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>handleDeleteShopProduct(prod.id)} style={{marginHorizontal:4}}>
                      <Ionicons name="trash-outline" size={24} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {selectedTab === 'aboutus' && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingAboutUs ? 'עריכת טקסט אודותינו' : 'אודותינו'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>טקסט אודותינו</Text>
                  <TextInput
                    style={styles.textInput}
                    value={aboutUsText}
                    onChangeText={setAboutUsText}
                    multiline
                    placeholder="כתוב טקסט אודותינו כאן..."
                    placeholderTextColor="#aaa"
                    textAlign="right"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>ביטול</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={saveAboutUsText}
                >
                  <Text style={styles.saveButtonText}>
                    {editingAboutUs ? 'שמור טקסט' : 'ערוך טקסט'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}


      <ToastMessage
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingTop: 100,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  imagesList: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  imageInfo: {
    padding: 12,
  },
  imageOrder: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  imageStatus: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  modalBody: {
    flex: 1,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  guidelinesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  guideline: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#007bff',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadFromDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  uploadFromDeviceButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  orText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
  },
  editingInfo: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  editingInfoText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
    textAlign: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButtonSmall: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminGalleryScreen;
