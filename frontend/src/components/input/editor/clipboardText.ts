import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// Plain-text copy keeps list markers. ProseMirror's default text serialization drops
// them, so a copied bulleted list would paste elsewhere as unrelated lines.
export function sliceToPlainText(slice: Slice): string {
	return contentLines(slice.content, '').join('\n')
}

function contentLines(fragment: Fragment, indent: string): string[] {
	const lines: string[] = []
	fragment.forEach(child => lines.push(...nodeLines(child, indent)))
	return lines
}

function nodeLines(node: ProseMirrorNode, indent: string): string[] {
	const {name} = node.type

	if (name === 'bulletList' || name === 'orderedList') {
		const items: ProseMirrorNode[] = []
		node.forEach(item => items.push(item))

		const lines: string[] = []
		items.forEach((item, index) => {
			const marker = name === 'orderedList' ? `${index + 1}. ` : '- '
			const childIndent = indent + ' '.repeat(marker.length)
			const itemLines = contentLines(item.content, childIndent)
			if (itemLines.length === 0) {
				lines.push((indent + marker).trimEnd())
				return
			}
			// The first line of the item carries the marker, the rest keep their nesting.
			itemLines[0] = indent + marker + itemLines[0].slice(childIndent.length)
			lines.push(...itemLines)
		})
		return lines
	}

	if (node.isTextblock) {
		return [indent + node.textContent]
	}

	return contentLines(node.content, indent)
}
