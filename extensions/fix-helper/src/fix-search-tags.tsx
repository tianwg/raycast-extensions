import { Action, ActionPanel, List, Icon, getPreferenceValues } from "@raycast/api";
import { useState, useMemo } from "react";
import { FIX_SPECS } from "./specs";

interface Preferences {
  defaultVersion: string;
  showIcons: boolean;
}

export interface TagItem {
  tag: number;
  name: string;
  type?: string;
  enums?: Record<string, string>;
}

import { getOnixsUrl, getTagIcon, getTagColor } from "./utils";

export function TagDetail({ tag, version }: { tag: TagItem; version: string }) {
  const enumEntries = tag.enums ? Object.entries(tag.enums) : [];

  return (
    <List navigationTitle={`${tag.name} (Tag ${tag.tag}) - ${version}`}>
      <List.Section title="Tag Details">
        <List.Item
          title="Tag Number"
          subtitle={String(tag.tag)}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                title="Open in OnixS Dictionary"
                url={getOnixsUrl(version, tag.tag)}
                shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
              />
              <Action.CopyToClipboard content={String(tag.tag)} title="Copy Tag Number" />
            </ActionPanel>
          }
        />
        <List.Item
          title="Tag Name"
          subtitle={tag.name}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                title="Open in OnixS Dictionary"
                url={getOnixsUrl(version, tag.tag)}
                shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
              />
              <Action.CopyToClipboard content={tag.name} title="Copy Tag Name" />
            </ActionPanel>
          }
        />
        {tag.type && (
          <List.Item
            title="Type"
            subtitle={tag.type}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard content={tag.type} title="Copy Type" />
              </ActionPanel>
            }
          />
        )}
      </List.Section>

      {enumEntries.length > 0 && (
        <List.Section title={`Valid Values (${enumEntries.length})`}>
          {enumEntries.map(([value, description]) => (
            <List.Item
              key={value}
              title={description}
              subtitle={value}
              icon={Icon.Tag}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard content={value} title="Copy Value" />
                  <Action.CopyToClipboard content={description} title="Copy Description" />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [version, setVersion] = useState(preferences.defaultVersion);
  const [searchText, setSearchText] = useState("");

  const spec = FIX_SPECS[version] || FIX_SPECS["FIX.4.4"];
  const versions = Object.keys(FIX_SPECS).sort();

  const tags: TagItem[] = useMemo(() => {
    return Object.entries(spec.tags)
      .map(([tagStr, tagDef]) => {
        const tag = parseInt(tagStr, 10);
        return {
          tag,
          name: tagDef.name,
          type: tagDef.type,
          enums: spec.enums[tag],
        };
      })
      .sort((a, b) => a.tag - b.tag);
  }, [spec]);

  const filteredTags = useMemo(() => {
    if (!searchText) return tags;
    const lowerSearch = searchText.toLowerCase();
    return tags.filter((t) => {
      const combined = `${t.tag} ${t.name} ${t.type || ""} ${
        t.enums ? Object.values(t.enums).join(" ") : ""
      }`.toLowerCase();
      return combined.includes(lowerSearch);
    });
  }, [tags, searchText]);

  return (
    <List
      navigationTitle={`Search FIX Tags (${version})`}
      searchBarPlaceholder="Search by tag number or name..."
      onSearchTextChange={setSearchText}
      searchBarAccessory={
        <List.Dropdown tooltip="Select FIX Version" value={version} onChange={setVersion}>
          {versions.map((v) => (
            <List.Dropdown.Item key={v} title={v} value={v} />
          ))}
        </List.Dropdown>
      }
    >
      {filteredTags.map((tag) => (
        <List.Item
          key={tag.tag}
          title={tag.name}
          subtitle={String(tag.tag)}
          accessories={[{ text: tag.enums ? `${Object.keys(tag.enums).length} values` : "" }]}
          icon={
            preferences.showIcons
              ? { source: getTagIcon(tag.tag, "", version), tintColor: getTagColor(tag.tag, "", version) }
              : undefined
          }
          actions={
            <ActionPanel>
              <Action.Push
                title="View Tag Details"
                icon={Icon.Sidebar}
                target={<TagDetail tag={tag} version={version} />}
              />
              <Action.OpenInBrowser
                title="Open in OnixS Dictionary"
                url={getOnixsUrl(version, tag.tag)}
                shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
              />
              <Action.CopyToClipboard content={String(tag.tag)} title="Copy Tag Number" />
              <Action.CopyToClipboard content={tag.name} title="Copy Tag Name" />
              {tag.type && <Action.CopyToClipboard content={tag.type} title="Copy Type" />}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
