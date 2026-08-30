/**
 * Multi-Group & Clean Slate Data Store for Contri Cost Splitter
 * Dynamic URL Hash Encoding for GitHub Pages & Cloud Hosting
 */

export const EMOJIS = ['👨‍💼', '👩‍🎨', '👨‍💻', '👩‍💻', '👨‍🔧', '👩‍🔬', '👨‍🚀', '👩‍🚒', '🦸‍♂️', '🧙‍♀️', '🧑‍🍳', '🕺'];
export const MEMBER_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444', '#14B8A6'];

export const CATEGORIES = [
  { id: 'materials', name: 'Materials & Supplies', icon: '📦' },
  { id: 'tools', name: 'Tools & Equipment', icon: '🛠️' },
  { id: 'food', name: 'Food & Refreshments', icon: '🍕' },
  { id: 'travel', name: 'Travel & Transport', icon: '🚗' },
  { id: 'hosting', name: 'Services & Bills', icon: '☁️' },
  { id: 'misc', name: 'Miscellaneous', icon: '📑' }
];

export const INITIAL_GROUPS_STORE = {
  activeGroupId: 'group-1',
  groups: [
    {
      id: 'group-1',
      name: 'Main Project Group',
      createdDate: new Date().toISOString().split('T')[0],
      members: [
        { id: 'm1', name: 'Person 1', role: 'Member', avatar: '👨‍💼', color: '#10B981' },
        { id: 'm2', name: 'Person 2', role: 'Member', avatar: '👩‍🎨', color: '#6366F1' },
        { id: 'm3', name: 'Person 3', role: 'Member', avatar: '👨‍💻', color: '#F59E0B' },
        { id: 'm4', name: 'Person 4', role: 'Member', avatar: '👩‍💻', color: '#EC4899' }
      ],
      contri: {
        targetPerMember: 0,
        contributions: {}
      },
      expenses: []
    }
  ]
};

const STORAGE_KEY = 'CONTRI_SPLITTER_MULTI_GROUP_V3';

export function loadStore() {
  // Check if opening via shareable link URL hash first
  const hashData = loadFromURLHash();
  if (hashData) {
    saveStore(hashData);
    history.replaceState(null, '', window.location.pathname);
    return hashData;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.groups && data.groups.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }
  return INITIAL_GROUPS_STORE;
}

export function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Error saving localStorage:', e);
  }
}

export function resetStoreToCleanSlate() {
  const store = {
    activeGroupId: 'group-1',
    groups: [
      {
        id: 'group-1',
        name: 'Project 1',
        createdDate: new Date().toISOString().split('T')[0],
        members: [
          { id: 'm1', name: 'Person 1', role: 'Member', avatar: '👨‍💼', color: '#10B981' },
          { id: 'm2', name: 'Person 2', role: 'Member', avatar: '👩‍🎨', color: '#6366F1' },
          { id: 'm3', name: 'Person 3', role: 'Member', avatar: '👨‍💻', color: '#F59E0B' },
          { id: 'm4', name: 'Person 4', role: 'Member', avatar: '👩‍💻', color: '#EC4899' }
        ],
        contri: {
          targetPerMember: 0,
          contributions: {}
        },
        expenses: []
      }
    ]
  };
  saveStore(store);
  return store;
}

/**
 * Encodes current project/group state into a compressed shareable URL
 * Dynamically uses window.location.origin and relative path for GitHub Pages
 */
export function generateShareableURLs(store) {
  try {
    const activeGroup = store.groups.find(g => g.id === store.activeGroupId) || store.groups[0];
    const payload = {
      activeGroupId: activeGroup.id,
      groups: [activeGroup]
    };
    const jsonStr = JSON.stringify(payload);
    const encoded = encodeURIComponent(btoa(jsonStr));

    const origin = (window.location.origin && window.location.origin !== 'null') 
      ? window.location.origin 
      : '';
    const pathname = window.location.pathname;

    const fullShareUrl = `${origin}${pathname}#share=${encoded}`;

    return {
      wifiUrl: fullShareUrl,
      currentUrl: fullShareUrl,
      rawHash: `#share=${encoded}`
    };
  } catch (e) {
    console.error('Error generating share link:', e);
    return { wifiUrl: window.location.href, currentUrl: window.location.href };
  }
}

/**
 * Decodes state from URL hash if user opened a shared link
 */
export function loadFromURLHash() {
  try {
    const hash = window.location.hash;
    if (hash && hash.includes('#share=')) {
      const encoded = hash.split('#share=')[1];
      if (encoded) {
        const jsonStr = atob(decodeURIComponent(encoded));
        const data = JSON.parse(jsonStr);
        if (data && data.groups) {
          return data;
        }
      }
    }
  } catch (e) {
    console.error('Error loading state from share URL:', e);
  }
  return null;
}
