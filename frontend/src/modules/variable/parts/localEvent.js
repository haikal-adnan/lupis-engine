import { Waypoints } from 'lucide-vue-next';

export const localEventsGroup = {
  id: 'local_events',
  label: 'Local Events',
  color: '#880E4F', // Pink Tua Gelap
  icon: Waypoints,
  items: [
    { 
      type: 'event_custom_local', 
      label: 'Create Event', 
      description: 'Define a new local event',
      defaultData: { 
        settings: { 
          headerTitle: 'MyEvent', 
          headerColor: '#880E4F', 
          category: 'Local Event', 
          visibleDataFields: ['eventName'] // Agar user bisa ubah nama langsung di node
        },
        data: { eventName: 'MyLocalEvent' },
        outputs: [{ _id: 'out', label: 'Out', type: 'execution', color: '#fff' }]
      }
    },
    { 
      type: 'action_call_local', 
      label: 'Call Event', 
      description: 'Trigger a local event',
      defaultData: { 
        settings: { 
          headerTitle: 'Call Event', 
          headerColor: '#AD1457', 
          category: 'Local Event', 
          visibleDataFields: ['eventName'] 
        },
        data: { eventName: 'MyLocalEvent' },
        inputs: [{ _id: 'in', label: 'In', type: 'execution', color: '#fff' }],
        outputs: [{ _id: 'out', label: 'Out', type: 'execution', color: '#fff' }]
      }
    },
  ]
};