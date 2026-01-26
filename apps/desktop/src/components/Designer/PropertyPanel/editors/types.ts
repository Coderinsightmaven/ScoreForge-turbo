/**
 * Common types for PropertyPanel editors.
 */
import { ScoreboardComponent } from '../../../../types/scoreboard';

/**
 * Common props interface for all property editors.
 */
export interface EditorProps {
  component: ScoreboardComponent;
  onDataChange: (property: string, value: any) => void;
  onStyleChange: (property: string, value: any) => void;
  onOpenImageManager?: () => void;
  onOpenVideoManager?: () => void;
}
