import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ApiClient } from '../client/ApiClient.js'
import { TagDto } from '../client/types.js'

function formatTag(tag: TagDto): string {
  return `**${tag.name}** (id: ${tag.id})${tag.color ? ` — color: ${tag.color}` : ''}`
}

export function registerTagTools(server: McpServer, getClient: () => ApiClient): void {
  server.tool(
    'list-tags',
    'List all available tags.',
    {},
    async () => {
      try {
        const tags = await getClient().listTags()
        if (tags.length === 0) return { content: [{ type: 'text', text: 'No tags found.' }] }
        const text = `Found ${tags.length} tag(s):\n\n` + tags.map(formatTag).join('\n')
        return { content: [{ type: 'text', text }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true }
      }
    }
  )

  server.tool(
    'create-tag',
    'Create a new tag.',
    {
      name: z.string().min(1).describe('Tag name'),
      color: z.string().optional().describe('Color (hex or CSS color name)'),
    },
    async ({ name, color }) => {
      try {
        const tag = await getClient().createTag({ name, color })
        return { content: [{ type: 'text', text: `Tag created!\n${formatTag(tag)}` }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true }
      }
    }
  )

  server.tool(
    'update-tag',
    'Update a tag by name or ID.',
    {
      tagName: z.string().optional().describe('Tag name (exact match, case-insensitive)'),
      tagId: z.string().optional().describe('Tag ID (takes priority over tagName)'),
      name: z.string().optional().describe('New name'),
      color: z.string().nullable().optional().describe('New color (null to remove)'),
    },
    async ({ tagName, tagId, name, color }) => {
      try {
        const client = getClient()
        const id = await client.resolveTagId(tagId, tagName)
        const tag = await client.updateTag(id, { name, color: color as string | null | undefined })
        return { content: [{ type: 'text', text: `Tag updated!\n${formatTag(tag)}` }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true }
      }
    }
  )

  server.tool(
    'delete-tag',
    'Delete a tag by name or ID.',
    {
      tagName: z.string().optional().describe('Tag name (exact match, case-insensitive)'),
      tagId: z.string().optional().describe('Tag ID (takes priority over tagName)'),
    },
    async ({ tagName, tagId }) => {
      try {
        const id = await getClient().resolveTagId(tagId, tagName)
        await getClient().deleteTag(id)
        return { content: [{ type: 'text', text: 'Tag deleted.' }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true }
      }
    }
  )
}
