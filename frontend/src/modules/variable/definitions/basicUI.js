import { MessageSquare } from 'lucide-vue-next';

export const basicUI = {
  id: 'ui',
  label: 'Interface',
  color: '#607D8B',
  icon: MessageSquare,
  items: [
    { 
      type: 'ui_notification', 
      label: 'Notification', 
      defaultData: { 
        settings: { headerTitle: 'Notification', headerColor: '#37474F', category: 'UI' },
        data: { message: 'Hello' }, 
        inputs: [
          // Ganti 'type' jadi 'dataType'
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'msg', label: 'Message', dataType: 'string', color: '#E040FB' }
        ],
        outputs: [
          { _id: 'out', label: 'Out', dataType: 'execution', color: '#fff' }
        ]
      } 
    }
  ]
};