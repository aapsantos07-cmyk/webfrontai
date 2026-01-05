import loading from 'react-useanimations/lib/loading';
import loading2 from 'react-useanimations/lib/loading2';
import menu2 from 'react-useanimations/lib/menu2';
import menu3 from 'react-useanimations/lib/menu3';
import trash from 'react-useanimations/lib/trash';
import trash2 from 'react-useanimations/lib/trash2';
import plusToX from 'react-useanimations/lib/plusToX';
import settings from 'react-useanimations/lib/settings';
import settings2 from 'react-useanimations/lib/settings2';
import download from 'react-useanimations/lib/download';
import lock from 'react-useanimations/lib/lock';
import activity from 'react-useanimations/lib/activity';
import alertTriangle from 'react-useanimations/lib/alertTriangle';
import alertCircle from 'react-useanimations/lib/alertCircle';
import searchToX from 'react-useanimations/lib/searchToX';
import checkbox from 'react-useanimations/lib/checkbox';

export const iconMappings = {
  // Priority 0 - Critical
  Loader2: { animated: true, animation: loading2 },
  Menu: { animated: true, animation: menu3 }, // Hamburger to X
  X: { animated: false }, // Handled by Menu animation

  // Priority 1 - High Impact
  Trash2: { animated: true, animation: trash2 },
  Plus: { animated: true, animation: plusToX },
  Settings: { animated: true, animation: settings2 },

  // Priority 2 - Medium Impact
  Download: { animated: true, animation: download },
  Lock: { animated: true, animation: lock },
  Activity: { animated: true, animation: activity },
  AlertTriangle: { animated: true, animation: alertTriangle },
  AlertCircle: { animated: true, animation: alertCircle },
  Search: { animated: true, animation: searchToX },

  // Optional - Use sparingly
  Check: { animated: true, animation: checkbox },
  CheckCircle2: { animated: true, animation: checkbox },
};
