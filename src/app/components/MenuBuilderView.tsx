/**
 * MenuBuilderView — presentational dual-pane Menu Builder (grid cards + images).
 *
 * LEFT: master product catalog (category tabs + unified item grid)
 * RIGHT: menu structure (sections/tabs → assigned items)
 *
 * Mobile: stacks catalog above structure (grid-cols-1 md:grid-cols-2).
 */

import { useMemo, useState } from 'react';
import {
  ArrowLeft, Plus, Trash2, X, Search, Save, Loader2, Pencil, Check, UtensilsCrossed,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

export interface MenuBuilderCatalogItem {
  id: number;
  nameEn: string;
  nameZh: string;
  availability: string;
  published: boolean;
  imageUrl?: string | null;
  /** Optional display price when the catalog provides one (e.g. "HK$48"). */
  priceLabel?: string | null;
  categoryId: number;
}

export interface MenuBuilderCatalogCategory {
  id: number;
  name: string;
  items: MenuBuilderCatalogItem[];
}

export interface MenuBuilderSectionItem {
  id: number;
  nameEn: string;
  nameZh: string;
  published: boolean;
  availability: string;
  imageUrl?: string | null;
  priceLabel?: string | null;
}

export interface MenuBuilderSection {
  /** Server id when persisted; null for newly added local sections. */
  id: number | null;
  /** Stable client key for React lists / active section tracking. */
  clientKey: string;
  name: string;
  sortOrder: number;
  items: MenuBuilderSectionItem[];
}

export interface MenuBuilderMenuMeta {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface MenuBuilderViewProps {
  menu: MenuBuilderMenuMeta;
  catalog: MenuBuilderCatalogCategory[];
  sections: MenuBuilderSection[];
  activeSectionKey: string | null;
  isLoading?: boolean;
  isSaving?: boolean;
  isDirty?: boolean;
  onBack?: () => void;
  onActiveSectionChange?: (clientKey: string) => void;
  onAddSection?: () => void;
  onRenameSection?: (clientKey: string, name: string) => void;
  onDeleteSection?: (clientKey: string) => void;
  onRemoveItem?: (sectionKey: string, itemId: number) => void;
  onAddItemsToActiveSection?: (itemIds: number[]) => void;
  onSave?: () => void;
}

function ProductImage({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-24 object-cover rounded-t-md bg-gray-100"
        loading="lazy"
      />
    );
  }

  return (
    <div
      className="w-full h-24 rounded-t-md bg-gray-100 flex items-center justify-center text-gray-400"
      aria-hidden
    >
      <UtensilsCrossed className="w-8 h-8" />
    </div>
  );
}

function availabilityLabel(availability: string): string {
  return availability === 'available' ? 'Available' : 'Unavailable';
}

export function MenuBuilderView({
  menu,
  catalog,
  sections,
  activeSectionKey,
  isLoading = false,
  isSaving = false,
  isDirty = false,
  onBack,
  onActiveSectionChange,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onRemoveItem,
  onAddItemsToActiveSection,
  onSave,
}: MenuBuilderViewProps) {
  const [catalogSearch, setCatalogSearch] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const activeSection = sections.find((s) => s.clientKey === activeSectionKey) ?? null;
  const assignedInActive = useMemo(
    () => new Set(activeSection?.items.map((i) => i.id) ?? []),
    [activeSection],
  );

  const catalogCategories = useMemo(
    () => catalog
      .filter((category) => category.items.length > 0)
      .map((category) => ({ id: category.id, name: category.name })),
    [catalog],
  );

  const masterItems = useMemo(
    () => catalog.flatMap((category) =>
      category.items.map((item) => ({
        ...item,
        categoryId: item.categoryId || category.id,
        categoryName: category.name,
      })),
    ),
    [catalog],
  );

  const catalogImageById = useMemo(() => {
    const map = new Map<number, string | null | undefined>();
    for (const item of masterItems) {
      map.set(item.id, item.imageUrl);
    }
    return map;
  }, [masterItems]);

  const catalogPriceById = useMemo(() => {
    const map = new Map<number, string | null | undefined>();
    for (const item of masterItems) {
      map.set(item.id, item.priceLabel);
    }
    return map;
  }, [masterItems]);

  const filteredCatalogItems = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();

    return masterItems.filter((item) => {
      if (activeCategoryTab !== 'All' && item.categoryName !== activeCategoryTab) {
        return false;
      }
      if (!q) return true;
      return (
        item.nameEn.toLowerCase().includes(q)
        || item.nameZh.toLowerCase().includes(q)
        || item.categoryName.toLowerCase().includes(q)
      );
    });
  }, [masterItems, activeCategoryTab, catalogSearch]);

  const toggleChecked = (id: number) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAddChecked = () => {
    if (checkedIds.length === 0) return;
    onAddItemsToActiveSection?.(checkedIds);
    setCheckedIds([]);
  };

  const startRename = (section: MenuBuilderSection) => {
    setRenamingKey(section.clientKey);
    setRenameDraft(section.name);
  };

  const commitRename = () => {
    if (!renamingKey) return;
    const next = renameDraft.trim();
    if (next) onRenameSection?.(renamingKey, next);
    setRenamingKey(null);
    setRenameDraft('');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center gap-2 text-gray-500 min-h-[320px]">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading menu builder...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1 shrink-0">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 truncate">
              Menu Builder — {menu.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {menu.startDate} → {menu.endDate ?? 'Open-ended'}
              {menu.isActive ? ' · Active' : ' · Inactive'}
              {isDirty ? ' · Unsaved changes' : ''}
            </p>
          </div>
        </div>
        <Button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="gap-2 shrink-0"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* LEFT — Catalog */}
        <Card className="p-4 space-y-3 order-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Product Catalog</h2>
              <p className="text-xs text-gray-500">Browse by category tab, then add to the active section</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddChecked}
              disabled={checkedIds.length === 0 || !activeSection}
              className="gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Section ({checkedIds.length})
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search catalog..."
              className="pl-9"
            />
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2">
            {['All', ...catalogCategories.map((category) => category.name)].map((tabName) => {
              const isActive = activeCategoryTab === tabName;
              return (
                <button
                  key={tabName}
                  type="button"
                  onClick={() => setActiveCategoryTab(tabName)}
                  className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-[#0f2942] text-white border-[#0f2942]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tabName}
                </button>
              );
            })}
          </div>

          {!activeSection ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Select or create a section on the right before adding items.
            </p>
          ) : null}

          <div className="max-h-[65vh] overflow-y-auto pr-1">
            {filteredCatalogItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No catalog items found.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCatalogItems.map((item) => {
                  const already = assignedInActive.has(item.id);
                  const checked = checkedIds.includes(item.id);
                  const disabled = already || !activeSection;

                  return (
                    <label
                      key={item.id}
                      className={`group relative flex flex-col rounded-md border bg-white overflow-hidden transition-all cursor-pointer ${
                        already
                          ? 'border-gray-100 opacity-60 cursor-not-allowed'
                          : checked
                            ? 'border-indigo-400 ring-2 ring-indigo-200 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="relative">
                        <ProductImage src={item.imageUrl} alt={item.nameEn} />
                        <input
                          type="checkbox"
                          className="absolute top-2 left-2 h-4 w-4 rounded border-gray-300 bg-white/90 shadow-sm"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleChecked(item.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="p-2.5 space-y-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                          {item.nameEn}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{item.nameZh}</p>
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          {item.priceLabel ? (
                            <span className="text-xs font-semibold text-gray-800 truncate">
                              {item.priceLabel}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 truncate">
                              {availabilityLabel(item.availability)}
                            </span>
                          )}
                          {!item.published ? (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] px-1.5">
                              Draft
                            </Badge>
                          ) : already ? (
                            <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 text-[10px] px-1.5">
                              Added
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* RIGHT — Menu structure */}
        <Card className="p-4 space-y-3 order-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Menu Structure</h2>
              <p className="text-xs text-gray-500">Sections / pages and assigned items</p>
            </div>
            <Button size="sm" variant="outline" onClick={onAddSection} className="gap-1">
              <Plus className="w-3.5 h-3.5" />
              Add Section
            </Button>
          </div>

          {sections.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10 border border-dashed rounded-lg">
              No sections yet. Add a section (e.g. Breakfast) to start building.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => {
                  const isActive = section.clientKey === activeSectionKey;
                  return (
                    <button
                      key={section.clientKey}
                      type="button"
                      onClick={() => onActiveSectionChange?.(section.clientKey)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-[#0f2942] text-white border-[#0f2942]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {section.name}
                      <Badge
                        className={
                          isActive
                            ? 'bg-white/20 text-white hover:bg-white/20'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                        }
                      >
                        {section.items.length}
                      </Badge>
                    </button>
                  );
                })}
              </div>

              {activeSection ? (
                <div className="space-y-3 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    {renamingKey === activeSection.clientKey ? (
                      <>
                        <Input
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') setRenamingKey(null);
                          }}
                        />
                        <Button size="sm" onClick={commitRename} className="gap-1">
                          <Check className="w-3.5 h-3.5" />
                          OK
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900 flex-1 truncate">
                          {activeSection.name}
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startRename(activeSection)}
                          className="gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Rename
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteSection?.(activeSection.clientKey)}
                          className="gap-1 text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="max-h-[50vh] overflow-y-auto pr-1">
                    {activeSection.items.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-6">
                        No items in this section. Select catalog items on the left and click Add.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                        {activeSection.items.map((item, index) => {
                          const imageUrl = item.imageUrl ?? catalogImageById.get(item.id);
                          const priceLabel = item.priceLabel ?? catalogPriceById.get(item.id);

                          return (
                            <div
                              key={item.id}
                              className="relative flex flex-col rounded-md border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="absolute top-1.5 left-1.5 z-10">
                                <Badge className="bg-black/55 text-white hover:bg-black/55 text-[10px] px-1.5">
                                  #{index + 1}
                                </Badge>
                              </div>
                              <button
                                type="button"
                                aria-label={`Remove ${item.nameEn}`}
                                onClick={() => onRemoveItem?.(activeSection.clientKey, item.id)}
                                className="absolute top-1.5 right-1.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 shadow-sm"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>

                              <ProductImage src={imageUrl} alt={item.nameEn} />

                              <div className="p-2.5 space-y-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                                  {item.nameEn}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{item.nameZh}</p>
                                <div className="flex items-center justify-between gap-1 pt-0.5">
                                  {priceLabel ? (
                                    <span className="text-xs font-semibold text-gray-800 truncate">
                                      {priceLabel}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-500 truncate">
                                      {availabilityLabel(item.availability)}
                                    </span>
                                  )}
                                  {!item.published ? (
                                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] px-1.5">
                                      Draft
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
