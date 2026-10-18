import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Search, X, Loader2 } from 'lucide-react';

export interface CitySuggestion {
  city: string;
  state: string;
  country: string;
  formatted: string;
}

// Comprehensive local dataset covering major Indian cities, pilgrimage & cultural centers, and international hubs
const TOP_CITIES_DATABASE: CitySuggestion[] = [
  // --- J (Immediate high-priority matches for user's prompt) ---
  { city: 'Jaipur', state: 'Rajasthan', country: 'India', formatted: 'Jaipur, Rajasthan, India' },
  { city: 'Jaisalmer', state: 'Rajasthan', country: 'India', formatted: 'Jaisalmer, Rajasthan, India' },
  { city: 'Jodhpur', state: 'Rajasthan', country: 'India', formatted: 'Jodhpur, Rajasthan, India' },
  { city: 'Jabalpur', state: 'Madhya Pradesh', country: 'India', formatted: 'Jabalpur, Madhya Pradesh, India' },
  { city: 'Jalandhar', state: 'Punjab', country: 'India', formatted: 'Jalandhar, Punjab, India' },
  { city: 'Jalgaon', state: 'Maharashtra', country: 'India', formatted: 'Jalgaon, Maharashtra, India' },
  { city: 'Jalna', state: 'Maharashtra', country: 'India', formatted: 'Jalna, Maharashtra, India' },
  { city: 'Jammu', state: 'Jammu and Kashmir', country: 'India', formatted: 'Jammu, Jammu and Kashmir, India' },
  { city: 'Jamnagar', state: 'Gujarat', country: 'India', formatted: 'Jamnagar, Gujarat, India' },
  { city: 'Jamshedpur', state: 'Jharkhand', country: 'India', formatted: 'Jamshedpur, Jharkhand, India' },
  { city: 'Jhansi', state: 'Uttar Pradesh', country: 'India', formatted: 'Jhansi, Uttar Pradesh, India' },
  { city: 'Junagadh', state: 'Gujarat', country: 'India', formatted: 'Junagadh, Gujarat, India' },
  { city: 'Jorhat', state: 'Assam', country: 'India', formatted: 'Jorhat, Assam, India' },
  { city: 'Jagdalpur', state: 'Chhattisgarh', country: 'India', formatted: 'Jagdalpur, Chhattisgarh, India' },
  { city: 'Jind', state: 'Haryana', country: 'India', formatted: 'Jind, Haryana, India' },
  { city: 'Jhunjhunu', state: 'Rajasthan', country: 'India', formatted: 'Jhunjhunu, Rajasthan, India' },
  { city: 'Johannesburg', state: 'Gauteng', country: 'South Africa', formatted: 'Johannesburg, Gauteng, South Africa' },
  { city: 'Jakarta', state: 'Special Capital Region', country: 'Indonesia', formatted: 'Jakarta, Special Capital Region, Indonesia' },
  { city: 'Jeddah', state: 'Makkah Province', country: 'Saudi Arabia', formatted: 'Jeddah, Makkah Province, Saudi Arabia' },
  { city: 'Jerusalem', state: 'Jerusalem District', country: 'Israel', formatted: 'Jerusalem, Jerusalem District, Israel' },

  // --- A ---
  { city: 'Agra', state: 'Uttar Pradesh', country: 'India', formatted: 'Agra, Uttar Pradesh, India' },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'India', formatted: 'Ahmedabad, Gujarat, India' },
  { city: 'Ajmer', state: 'Rajasthan', country: 'India', formatted: 'Ajmer, Rajasthan, India' },
  { city: 'Akola', state: 'Maharashtra', country: 'India', formatted: 'Akola, Maharashtra, India' },
  { city: 'Aligarh', state: 'Uttar Pradesh', country: 'India', formatted: 'Aligarh, Uttar Pradesh, India' },
  { city: 'Allahabad (Prayagraj)', state: 'Uttar Pradesh', country: 'India', formatted: 'Allahabad (Prayagraj), Uttar Pradesh, India' },
  { city: 'Alwar', state: 'Rajasthan', country: 'India', formatted: 'Alwar, Rajasthan, India' },
  { city: 'Ambala', state: 'Haryana', country: 'India', formatted: 'Ambala, Haryana, India' },
  { city: 'Amravati', state: 'Maharashtra', country: 'India', formatted: 'Amravati, Maharashtra, India' },
  { city: 'Amritsar', state: 'Punjab', country: 'India', formatted: 'Amritsar, Punjab, India' },
  { city: 'Anand', state: 'Gujarat', country: 'India', formatted: 'Anand, Gujarat, India' },
  { city: 'Anantapur', state: 'Andhra Pradesh', country: 'India', formatted: 'Anantapur, Andhra Pradesh, India' },
  { city: 'Asansol', state: 'West Bengal', country: 'India', formatted: 'Asansol, West Bengal, India' },
  { city: 'Aurangabad (Chhatrapati Sambhaji Nagar)', state: 'Maharashtra', country: 'India', formatted: 'Aurangabad, Maharashtra, India' },
  { city: 'Ayodhya', state: 'Uttar Pradesh', country: 'India', formatted: 'Ayodhya, Uttar Pradesh, India' },
  { city: 'Abu Dhabi', state: 'Abu Dhabi', country: 'United Arab Emirates', formatted: 'Abu Dhabi, Abu Dhabi, United Arab Emirates' },
  { city: 'Amsterdam', state: 'North Holland', country: 'Netherlands', formatted: 'Amsterdam, North Holland, Netherlands' },
  { city: 'Auckland', state: 'Auckland Region', country: 'New Zealand', formatted: 'Auckland, Auckland Region, New Zealand' },
  { city: 'Austin', state: 'Texas', country: 'United States', formatted: 'Austin, Texas, United States' },

  // --- B ---
  { city: 'Bengaluru (Bangalore)', state: 'Karnataka', country: 'India', formatted: 'Bengaluru, Karnataka, India' },
  { city: 'Bareilly', state: 'Uttar Pradesh', country: 'India', formatted: 'Bareilly, Uttar Pradesh, India' },
  { city: 'Bathinda', state: 'Punjab', country: 'India', formatted: 'Bathinda, Punjab, India' },
  { city: 'Belagavi (Belgaum)', state: 'Karnataka', country: 'India', formatted: 'Belagavi, Karnataka, India' },
  { city: 'Bhavnagar', state: 'Gujarat', country: 'India', formatted: 'Bhavnagar, Gujarat, India' },
  { city: 'Bhilai', state: 'Chhattisgarh', country: 'India', formatted: 'Bhilai, Chhattisgarh, India' },
  { city: 'Bhilwara', state: 'Rajasthan', country: 'India', formatted: 'Bhilwara, Rajasthan, India' },
  { city: 'Bhopal', state: 'Madhya Pradesh', country: 'India', formatted: 'Bhopal, Madhya Pradesh, India' },
  { city: 'Bhubaneswar', state: 'Odisha', country: 'India', formatted: 'Bhubaneswar, Odisha, India' },
  { city: 'Bhuj', state: 'Gujarat', country: 'India', formatted: 'Bhuj, Gujarat, India' },
  { city: 'Bikaner', state: 'Rajasthan', country: 'India', formatted: 'Bikaner, Rajasthan, India' },
  { city: 'Bilaspur', state: 'Chhattisgarh', country: 'India', formatted: 'Bilaspur, Chhattisgarh, India' },
  { city: 'Bodh Gaya', state: 'Bihar', country: 'India', formatted: 'Bodh Gaya, Bihar, India' },
  { city: 'Bokaro', state: 'Jharkhand', country: 'India', formatted: 'Bokaro, Jharkhand, India' },
  { city: 'Bangkok', state: 'Bangkok', country: 'Thailand', formatted: 'Bangkok, Bangkok, Thailand' },
  { city: 'Berlin', state: 'Berlin', country: 'Germany', formatted: 'Berlin, Berlin, Germany' },
  { city: 'Birmingham', state: 'England', country: 'United Kingdom', formatted: 'Birmingham, England, United Kingdom' },
  { city: 'Boston', state: 'Massachusetts', country: 'United States', formatted: 'Boston, Massachusetts, United States' },
  { city: 'Brisbane', state: 'Queensland', country: 'Australia', formatted: 'Brisbane, Queensland, Australia' },

  // --- C ---
  { city: 'Chandigarh', state: 'Chandigarh', country: 'India', formatted: 'Chandigarh, Chandigarh, India' },
  { city: 'Chennai (Madras)', state: 'Tamil Nadu', country: 'India', formatted: 'Chennai, Tamil Nadu, India' },
  { city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', formatted: 'Coimbatore, Tamil Nadu, India' },
  { city: 'Cuttack', state: 'Odisha', country: 'India', formatted: 'Cuttack, Odisha, India' },
  { city: 'Chicago', state: 'Illinois', country: 'United States', formatted: 'Chicago, Illinois, United States' },
  { city: 'Calgary', state: 'Alberta', country: 'Canada', formatted: 'Calgary, Alberta, Canada' },

  // --- D ---
  { city: 'Dehradun', state: 'Uttarakhand', country: 'India', formatted: 'Dehradun, Uttarakhand, India' },
  { city: 'Delhi', state: 'Delhi', country: 'India', formatted: 'Delhi, Delhi, India' },
  { city: 'Dhanbad', state: 'Jharkhand', country: 'India', formatted: 'Dhanbad, Jharkhand, India' },
  { city: 'Dharamsala', state: 'Himachal Pradesh', country: 'India', formatted: 'Dharamsala, Himachal Pradesh, India' },
  { city: 'Dhule', state: 'Maharashtra', country: 'India', formatted: 'Dhule, Maharashtra, India' },
  { city: 'Dibrugarh', state: 'Assam', country: 'India', formatted: 'Dibrugarh, Assam, India' },
  { city: 'Durgapur', state: 'West Bengal', country: 'India', formatted: 'Durgapur, West Bengal, India' },
  { city: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', formatted: 'Dubai, Dubai, United Arab Emirates' },
  { city: 'Dublin', state: 'Leinster', country: 'Ireland', formatted: 'Dublin, Leinster, Ireland' },
  { city: 'Dallas', state: 'Texas', country: 'United States', formatted: 'Dallas, Texas, United States' },
  { city: 'Doha', state: 'Ad-Dawhah', country: 'Qatar', formatted: 'Doha, Ad-Dawhah, Qatar' },

  // --- E & F ---
  { city: 'Ernakulam (Kochi)', state: 'Kerala', country: 'India', formatted: 'Ernakulam (Kochi), Kerala, India' },
  { city: 'Erode', state: 'Tamil Nadu', country: 'India', formatted: 'Erode, Tamil Nadu, India' },
  { city: 'Faridabad', state: 'Haryana', country: 'India', formatted: 'Faridabad, Haryana, India' },
  { city: 'Firozabad', state: 'Uttar Pradesh', country: 'India', formatted: 'Firozabad, Uttar Pradesh, India' },
  { city: 'Frankfurt', state: 'Hesse', country: 'Germany', formatted: 'Frankfurt, Hesse, Germany' },

  // --- G ---
  { city: 'Gandhinagar', state: 'Gujarat', country: 'India', formatted: 'Gandhinagar, Gujarat, India' },
  { city: 'Gaya', state: 'Bihar', country: 'India', formatted: 'Gaya, Bihar, India' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh', country: 'India', formatted: 'Ghaziabad, Uttar Pradesh, India' },
  { city: 'Gorakhpur', state: 'Uttar Pradesh', country: 'India', formatted: 'Gorakhpur, Uttar Pradesh, India' },
  { city: 'Gulbarga (Kalaburagi)', state: 'Karnataka', country: 'India', formatted: 'Gulbarga, Karnataka, India' },
  { city: 'Guntur', state: 'Andhra Pradesh', country: 'India', formatted: 'Guntur, Andhra Pradesh, India' },
  { city: 'Gurgaon (Gurugram)', state: 'Haryana', country: 'India', formatted: 'Gurgaon (Gurugram), Haryana, India' },
  { city: 'Guwahati', state: 'Assam', country: 'India', formatted: 'Guwahati, Assam, India' },
  { city: 'Gwalior', state: 'Madhya Pradesh', country: 'India', formatted: 'Gwalior, Madhya Pradesh, India' },

  // --- H ---
  { city: 'Haridwar', state: 'Uttarakhand', country: 'India', formatted: 'Haridwar, Uttarakhand, India' },
  { city: 'Hisar', state: 'Haryana', country: 'India', formatted: 'Hisar, Haryana, India' },
  { city: 'Hoshiarpur', state: 'Punjab', country: 'India', formatted: 'Hoshiarpur, Punjab, India' },
  { city: 'Howrah', state: 'West Bengal', country: 'India', formatted: 'Howrah, West Bengal, India' },
  { city: 'Hubli-Dharwad', state: 'Karnataka', country: 'India', formatted: 'Hubli-Dharwad, Karnataka, India' },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', formatted: 'Hyderabad, Telangana, India' },
  { city: 'Houston', state: 'Texas', country: 'United States', formatted: 'Houston, Texas, United States' },
  { city: 'Hong Kong', state: 'Hong Kong SAR', country: 'Hong Kong', formatted: 'Hong Kong, Hong Kong SAR, Hong Kong' },

  // --- I ---
  { city: 'Indore', state: 'Madhya Pradesh', country: 'India', formatted: 'Indore, Madhya Pradesh, India' },
  { city: 'Imphal', state: 'Manipur', country: 'India', formatted: 'Imphal, Manipur, India' },
  { city: 'Itanagar', state: 'Arunachal Pradesh', country: 'India', formatted: 'Itanagar, Arunachal Pradesh, India' },

  // --- K ---
  { city: 'Kalyan', state: 'Maharashtra', country: 'India', formatted: 'Kalyan, Maharashtra, India' },
  { city: 'Kannur', state: 'Kerala', country: 'India', formatted: 'Kannur, Kerala, India' },
  { city: 'Kanpur', state: 'Uttar Pradesh', country: 'India', formatted: 'Kanpur, Uttar Pradesh, India' },
  { city: 'Karnal', state: 'Haryana', country: 'India', formatted: 'Karnal, Haryana, India' },
  { city: 'Kharagpur', state: 'West Bengal', country: 'India', formatted: 'Kharagpur, West Bengal, India' },
  { city: 'Kochi', state: 'Kerala', country: 'India', formatted: 'Kochi, Kerala, India' },
  { city: 'Kolhapur', state: 'Maharashtra', country: 'India', formatted: 'Kolhapur, Maharashtra, India' },
  { city: 'Kolkata (Calcutta)', state: 'West Bengal', country: 'India', formatted: 'Kolkata, West Bengal, India' },
  { city: 'Kollam', state: 'Kerala', country: 'India', formatted: 'Kollam, Kerala, India' },
  { city: 'Kota', state: 'Rajasthan', country: 'India', formatted: 'Kota, Rajasthan, India' },
  { city: 'Kozhikode (Calicut)', state: 'Kerala', country: 'India', formatted: 'Kozhikode, Kerala, India' },
  { city: 'Kuala Lumpur', state: 'Federal Territory', country: 'Malaysia', formatted: 'Kuala Lumpur, Federal Territory, Malaysia' },

  // --- L ---
  { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', formatted: 'Lucknow, Uttar Pradesh, India' },
  { city: 'Ludhiana', state: 'Punjab', country: 'India', formatted: 'Ludhiana, Punjab, India' },
  { city: 'London', state: 'England', country: 'United Kingdom', formatted: 'London, England, United Kingdom' },
  { city: 'Los Angeles', state: 'California', country: 'United States', formatted: 'Los Angeles, California, United States' },

  // --- M ---
  { city: 'Madurai', state: 'Tamil Nadu', country: 'India', formatted: 'Madurai, Tamil Nadu, India' },
  { city: 'Mangalore (Mangaluru)', state: 'Karnataka', country: 'India', formatted: 'Mangalore, Karnataka, India' },
  { city: 'Mathura', state: 'Uttar Pradesh', country: 'India', formatted: 'Mathura, Uttar Pradesh, India' },
  { city: 'Meerut', state: 'Uttar Pradesh', country: 'India', formatted: 'Meerut, Uttar Pradesh, India' },
  { city: 'Moradabad', state: 'Uttar Pradesh', country: 'India', formatted: 'Moradabad, Uttar Pradesh, India' },
  { city: 'Mumbai (Bombay)', state: 'Maharashtra', country: 'India', formatted: 'Mumbai, Maharashtra, India' },
  { city: 'Muzaffarnagar', state: 'Uttar Pradesh', country: 'India', formatted: 'Muzaffarnagar, Uttar Pradesh, India' },
  { city: 'Muzaffarpur', state: 'Bihar', country: 'India', formatted: 'Muzaffarpur, Bihar, India' },
  { city: 'Mysore (Mysuru)', state: 'Karnataka', country: 'India', formatted: 'Mysore, Karnataka, India' },
  { city: 'Manchester', state: 'England', country: 'United Kingdom', formatted: 'Manchester, England, United Kingdom' },
  { city: 'Melbourne', state: 'Victoria', country: 'Australia', formatted: 'Melbourne, Victoria, Australia' },
  { city: 'Munich', state: 'Bavaria', country: 'Germany', formatted: 'Munich, Bavaria, Germany' },

  // --- N ---
  { city: 'Nagpur', state: 'Maharashtra', country: 'India', formatted: 'Nagpur, Maharashtra, India' },
  { city: 'Nanded', state: 'Maharashtra', country: 'India', formatted: 'Nanded, Maharashtra, India' },
  { city: 'Nashik', state: 'Maharashtra', country: 'India', formatted: 'Nashik, Maharashtra, India' },
  { city: 'Navi Mumbai', state: 'Maharashtra', country: 'India', formatted: 'Navi Mumbai, Maharashtra, India' },
  { city: 'New Delhi', state: 'Delhi', country: 'India', formatted: 'New Delhi, Delhi, India' },
  { city: 'Noida', state: 'Uttar Pradesh', country: 'India', formatted: 'Noida, Uttar Pradesh, India' },
  { city: 'New York', state: 'New York', country: 'United States', formatted: 'New York, New York, United States' },

  // --- P ---
  { city: 'Panaji (Goa)', state: 'Goa', country: 'India', formatted: 'Panaji, Goa, India' },
  { city: 'Panipat', state: 'Haryana', country: 'India', formatted: 'Panipat, Haryana, India' },
  { city: 'Patiala', state: 'Punjab', country: 'India', formatted: 'Patiala, Punjab, India' },
  { city: 'Patna', state: 'Bihar', country: 'India', formatted: 'Patna, Bihar, India' },
  { city: 'Pune (Poona)', state: 'Maharashtra', country: 'India', formatted: 'Pune, Maharashtra, India' },
  { city: 'Puri', state: 'Odisha', country: 'India', formatted: 'Puri, Odisha, India' },
  { city: 'Paris', state: 'Île-de-France', country: 'France', formatted: 'Paris, Île-de-France, France' },
  { city: 'Perth', state: 'Western Australia', country: 'Australia', formatted: 'Perth, Western Australia, Australia' },
  { city: 'Philadelphia', state: 'Pennsylvania', country: 'United States', formatted: 'Philadelphia, Pennsylvania, United States' },
  { city: 'Phoenix', state: 'Arizona', country: 'United States', formatted: 'Phoenix, Arizona, United States' },

  // --- R ---
  { city: 'Raipur', state: 'Chhattisgarh', country: 'India', formatted: 'Raipur, Chhattisgarh, India' },
  { city: 'Rajahmundry', state: 'Andhra Pradesh', country: 'India', formatted: 'Rajahmundry, Andhra Pradesh, India' },
  { city: 'Rajkot', state: 'Gujarat', country: 'India', formatted: 'Rajkot, Gujarat, India' },
  { city: 'Ranchi', state: 'Jharkhand', country: 'India', formatted: 'Ranchi, Jharkhand, India' },
  { city: 'Rishikesh', state: 'Uttarakhand', country: 'India', formatted: 'Rishikesh, Uttarakhand, India' },
  { city: 'Rohtak', state: 'Haryana', country: 'India', formatted: 'Rohtak, Haryana, India' },
  { city: 'Rourkela', state: 'Odisha', country: 'India', formatted: 'Rourkela, Odisha, India' },

  // --- S ---
  { city: 'Saharanpur', state: 'Uttar Pradesh', country: 'India', formatted: 'Saharanpur, Uttar Pradesh, India' },
  { city: 'Salem', state: 'Tamil Nadu', country: 'India', formatted: 'Salem, Tamil Nadu, India' },
  { city: 'Sambalpur', state: 'Odisha', country: 'India', formatted: 'Sambalpur, Odisha, India' },
  { city: 'Sangli', state: 'Maharashtra', country: 'India', formatted: 'Sangli, Maharashtra, India' },
  { city: 'Satara', state: 'Maharashtra', country: 'India', formatted: 'Satara, Maharashtra, India' },
  { city: 'Shillong', state: 'Meghalaya', country: 'India', formatted: 'Shillong, Meghalaya, India' },
  { city: 'Shimla', state: 'Himachal Pradesh', country: 'India', formatted: 'Shimla, Himachal Pradesh, India' },
  { city: 'Siliguri', state: 'West Bengal', country: 'India', formatted: 'Siliguri, West Bengal, India' },
  { city: 'Solapur', state: 'Maharashtra', country: 'India', formatted: 'Solapur, Maharashtra, India' },
  { city: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', formatted: 'Srinagar, Jammu and Kashmir, India' },
  { city: 'Surat', state: 'Gujarat', country: 'India', formatted: 'Surat, Gujarat, India' },
  { city: 'San Francisco', state: 'California', country: 'United States', formatted: 'San Francisco, California, United States' },
  { city: 'San Jose', state: 'California', country: 'United States', formatted: 'San Jose, California, United States' },
  { city: 'Seattle', state: 'Washington', country: 'United States', formatted: 'Seattle, Washington, United States' },
  { city: 'Singapore', state: 'Singapore', country: 'Singapore', formatted: 'Singapore, Singapore, Singapore' },
  { city: 'Sydney', state: 'New South Wales', country: 'Australia', formatted: 'Sydney, New South Wales, Australia' },

  // --- T ---
  { city: 'Thane', state: 'Maharashtra', country: 'India', formatted: 'Thane, Maharashtra, India' },
  { city: 'Thiruvananthapuram (Trivandrum)', state: 'Kerala', country: 'India', formatted: 'Thiruvananthapuram, Kerala, India' },
  { city: 'Thrissur', state: 'Kerala', country: 'India', formatted: 'Thrissur, Kerala, India' },
  { city: 'Tiruchirappalli (Trichy)', state: 'Tamil Nadu', country: 'India', formatted: 'Tiruchirappalli, Tamil Nadu, India' },
  { city: 'Tirunelveli', state: 'Tamil Nadu', country: 'India', formatted: 'Tirunelveli, Tamil Nadu, India' },
  { city: 'Tirupati', state: 'Andhra Pradesh', country: 'India', formatted: 'Tirupati, Andhra Pradesh, India' },
  { city: 'Tiruppur', state: 'Tamil Nadu', country: 'India', formatted: 'Tiruppur, Tamil Nadu, India' },
  { city: 'Tokyo', state: 'Tokyo', country: 'Japan', formatted: 'Tokyo, Tokyo, Japan' },
  { city: 'Toronto', state: 'Ontario', country: 'Canada', formatted: 'Toronto, Ontario, Canada' },

  // --- U, V, W ---
  { city: 'Udaipur', state: 'Rajasthan', country: 'India', formatted: 'Udaipur, Rajasthan, India' },
  { city: 'Ujjain', state: 'Madhya Pradesh', country: 'India', formatted: 'Ujjain, Madhya Pradesh, India' },
  { city: 'Vadodara (Baroda)', state: 'Gujarat', country: 'India', formatted: 'Vadodara, Gujarat, India' },
  { city: 'Varanasi (Kashi / Benares)', state: 'Uttar Pradesh', country: 'India', formatted: 'Varanasi, Uttar Pradesh, India' },
  { city: 'Vasai-Virar', state: 'Maharashtra', country: 'India', formatted: 'Vasai-Virar, Maharashtra, India' },
  { city: 'Vellore', state: 'Tamil Nadu', country: 'India', formatted: 'Vellore, Tamil Nadu, India' },
  { city: 'Vijayawada', state: 'Andhra Pradesh', country: 'India', formatted: 'Vijayawada, Andhra Pradesh, India' },
  { city: 'Visakhapatnam (Vizag)', state: 'Andhra Pradesh', country: 'India', formatted: 'Visakhapatnam, Andhra Pradesh, India' },
  { city: 'Vrindavan', state: 'Uttar Pradesh', country: 'India', formatted: 'Vrindavan, Uttar Pradesh, India' },
  { city: 'Warangal', state: 'Telangana', country: 'India', formatted: 'Warangal, Telangana, India' },
  { city: 'Vancouver', state: 'British Columbia', country: 'Canada', formatted: 'Vancouver, British Columbia, Canada' }
];

interface CityAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const CityAutocompleteInput: React.FC<CityAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder = 'e.g. Jaipur, Rajasthan, India',
  label = 'Place of Birth (City / Town / Country)',
  required = false,
  disabled = false,
  className = '',
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [remoteSuggestions, setRemoteSuggestions] = useState<CitySuggestion[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [maxMenuHeight, setMaxMenuHeight] = useState<number>(260);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dynamic space detection: expand to top or bottom based on available space
  const updatePlacement = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const scrollParent = containerRef.current.closest('.apple-card, [role="dialog"], .modal-content') as HTMLElement | null;
    const boundaryBottom = scrollParent
      ? Math.min(window.innerHeight, scrollParent.getBoundingClientRect().bottom)
      : window.innerHeight;
    const boundaryTop = scrollParent
      ? Math.max(0, scrollParent.getBoundingClientRect().top)
      : 0;

    const spaceBelow = boundaryBottom - rect.bottom - 16;
    const spaceAbove = rect.top - boundaryTop - 16;
    const preferredHeight = 260;

    if (spaceBelow < 220 && spaceAbove > spaceBelow) {
      setPlacement('top');
      setMaxMenuHeight(Math.max(120, Math.min(preferredHeight, spaceAbove - 10)));
    } else {
      setPlacement('bottom');
      setMaxMenuHeight(Math.max(120, Math.min(preferredHeight, spaceBelow - 10)));
    }
  };

  // 1. Instant 0ms local search
  const localSuggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];

    // Prioritize cities starting with the query (e.g. "J" matches Jaipur, Jaisalmer, etc.)
    const prefixMatches: CitySuggestion[] = [];
    const otherMatches: CitySuggestion[] = [];

    for (const item of TOP_CITIES_DATABASE) {
      const cityLower = item.city.toLowerCase();
      const stateLower = item.state.toLowerCase();
      const countryLower = item.country.toLowerCase();

      if (cityLower.startsWith(q)) {
        prefixMatches.push(item);
      } else if (
        cityLower.includes(q) ||
        stateLower.includes(q) ||
        countryLower.includes(q)
      ) {
        otherMatches.push(item);
      }
    }

    return [...prefixMatches, ...otherMatches].slice(0, 10);
  }, [value]);

  // 2. High-speed geocoding fallback for rare / smaller locations (Photon OpenStreetMap)
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setRemoteSuggestions([]);
      setIsSearchingRemote(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsSearchingRemote(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Geocoding error');
        const data = await res.json();

        if (data && Array.isArray(data.features)) {
          const fetched: CitySuggestion[] = data.features
            .map((f: any) => {
              const p = f.properties || {};
              const cityName = p.city || p.name || p.town || p.village || '';
              const stateName = p.state || p.county || '';
              const countryName = p.country || '';
              if (!cityName) return null;

              const parts = [cityName];
              if (stateName && stateName !== cityName) parts.push(stateName);
              if (countryName) parts.push(countryName);

              return {
                city: cityName,
                state: stateName,
                country: countryName,
                formatted: parts.join(', ')
              };
            })
            .filter((item: any): item is CitySuggestion => Boolean(item));

          setRemoteSuggestions(fetched);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setRemoteSuggestions([]);
        }
      } finally {
        setIsSearchingRemote(false);
      }
    }, 240);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  // Combined suggestions, deduplicated
  const combinedSuggestions = useMemo(() => {
    const map = new Map<string, CitySuggestion>();
    for (const item of localSuggestions) {
      map.set(item.formatted.toLowerCase(), item);
    }
    for (const item of remoteSuggestions) {
      const key = item.formatted.toLowerCase();
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values()).slice(0, 8);
  }, [localSuggestions, remoteSuggestions]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update placement dynamically whenever open or suggestions change
  useEffect(() => {
    if (isOpen) {
      updatePlacement();
      const handleScrollOrResize = () => updatePlacement();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    }
  }, [isOpen, combinedSuggestions.length]);

  const handleSelect = (suggestion: CitySuggestion) => {
    onChange(suggestion.formatted);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || combinedSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && value.trim()) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % combinedSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? combinedSuggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < combinedSuggestions.length) {
        e.preventDefault();
        handleSelect(combinedSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} className={className}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 12.5,
            fontWeight: 500,
            color: '#1D1D1F',
            marginBottom: 4
          }}
        >
          {label} {required && <span style={{ color: '#E03131' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          ref={inputRef}
          type="text"
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (value.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="apple-input"
          style={{
            width: '100%',
            paddingRight: value ? 36 : 12,
            boxSizing: 'border-box'
          }}
          autoComplete="off"
        />

        {/* Clear Button or Indicator */}
        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
              setIsOpen(false);
            }}
            style={{
              position: 'absolute',
              right: 10,
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: '#86868B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Clear"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Popover */}
      {isOpen && combinedSuggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            ...(placement === 'top'
              ? { bottom: 'calc(100% + 6px)', top: 'auto' }
              : { top: 'calc(100% + 6px)', bottom: 'auto' }),
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: 14,
            boxShadow: placement === 'top'
              ? '0 -14px 34px rgba(0, 0, 0, 0.14), 0 -2px 6px rgba(0, 0, 0, 0.04)'
              : '0 14px 34px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            maxHeight: maxMenuHeight,
            overflowY: 'auto',
            animation: placement === 'top'
              ? 'appleDropdownFadeInUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'appleDropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div
            style={{
              padding: '6px 12px 4px',
              fontSize: 10.5,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#86868B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              backgroundColor: '#FAFAFC'
            }}
          >
            <span>Suggested Places (City, State, Country)</span>
            {isSearchingRemote && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#3A3A6E' }}>
                <Loader2 size={11} className="spin-slow" /> Verifying global coordinates...
              </span>
            )}
          </div>

          <div role="listbox">
            {combinedSuggestions.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={`${item.formatted}-${idx}`}
                  onClick={() => handleSelect(item)}
                  role="option"
                  aria-selected={isHighlighted}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '9px 12px',
                    gap: 10,
                    cursor: 'pointer',
                    backgroundColor: isHighlighted ? 'rgba(58, 58, 110, 0.08)' : 'transparent',
                    borderBottom: idx < combinedSuggestions.length - 1 ? '1px solid rgba(0, 0, 0, 0.03)' : 'none',
                    transition: 'background-color 0.1s ease'
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      backgroundColor: '#F5F5F7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3A3A6E',
                      flexShrink: 0
                    }}
                  >
                    <MapPin size={14} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>
                      {item.city}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: '#6E6E73',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.state ? `${item.state}, ` : ''}{item.country}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
