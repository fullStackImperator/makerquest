import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import {
  TableCellNode,
  TableNode,
  TableRowNode,
} from './nodes/TableNode/TableNode'
// import { ListItemNode, ListNode } from './nodes/ListNodeNew'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeHighlightNode, CodeNode } from './nodes/CodeNode'
import { CollapsibleContainerNode } from './plugins/CollapsiblePluging/CollapsibleContainerNode'
import { CollapsibleContentNode } from './plugins/CollapsiblePluging/CollapsibleContentNode'
import { CollapsibleTitleNode } from './plugins/CollapsiblePluging/CollapsibleTitleNode'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { HorizontalRuleNode } from './nodes/HorizontalRuleNode/HorizontalRuleNode'
import { MathNode } from './nodes/MathNode'
import { ImageNode } from './nodes/ImageNodeNew/ImageNode'
import { SketchNode } from './nodes/SketchNode/SketchNode'
import { GraphNode } from './nodes/GraphNode'
import { StickyNode } from './nodes/StickyNodeNew/StickyNode'
import theme from './theme'
import { PageBreakNode } from './nodes/PageBreakNode'
import { IFrameNode } from './nodes/IFrameNode/IFrameNode'
import { LayoutContainerNode, LayoutItemNode } from './nodes/LayoutNode'
import { YouTubeNode } from './nodes/YouTubeNode'
import { AlertNode } from './nodes/AlertNode/AlertNode'
import { MultipleChoiceNode } from './nodes/MultipleChoiceNode/MultipleChoiceNode'

export const editorConfig = {
  namespace: 'matheditor',
  theme: theme,
  onError(error: Error) {
    // Throwing here kills the editor in production for any recoverable error.
    // Log instead so the editor stays usable; surface fatal issues via console.
    console.error('[Lexical]', error)
  },
  // Any custom nodes go here
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    CollapsibleContainerNode,
    CollapsibleContentNode,
    CollapsibleTitleNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    HorizontalRuleNode,
    MathNode,
    MultipleChoiceNode,
    ImageNode,
    SketchNode,
    GraphNode,
    StickyNode,
    AlertNode,
    PageBreakNode,
    IFrameNode,
    LayoutContainerNode,
    LayoutItemNode,
    YouTubeNode,
  ],
}

/** Blocks that only make sense in teacher-authored content. */
const TEACHER_ONLY_NODES: ReadonlySet<unknown> = new Set([
  MultipleChoiceNode,
  StickyNode,
  PageBreakNode,
  IFrameNode,
  LayoutContainerNode,
  LayoutItemNode,
])

// Toolbar and slash menu only offer blocks whose node is registered,
// so a smaller node list is enough to hide them for students.
export const studentEditorConfig = {
  ...editorConfig,
  nodes: editorConfig.nodes.filter((node) => !TEACHER_ONLY_NODES.has(node)),
}
