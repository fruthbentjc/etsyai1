import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, GripVertical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProductImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  productId?: string;
}

export default function ProductImageManager({ images, onChange, productId }: ProductImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const folder = productId || "new";

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast({ title: "Fichier ignoré", description: `${file.name} n'est pas une image.`, variant: "destructive" });
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: "Fichier trop volumineux", description: `${file.name} dépasse 5 Mo.`, variant: "destructive" });
          continue;
        }

        const ext = file.name.split(".").pop() || "jpg";
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage.from("product-images").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;

        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }

      onChange([...images, ...newUrls]);
      if (newUrls.length > 0) {
        toast({ title: `${newUrls.length} photo(s) ajoutée(s)` });
      }
    } catch (e: any) {
      toast({ title: "Erreur d'upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [images, onChange, folder, toast]);

  const handleRemove = useCallback(async (index: number) => {
    const url = images[index];
    // Try to extract path from URL and delete from storage
    try {
      const match = url.match(/product-images\/(.+)$/);
      if (match) {
        await supabase.storage.from("product-images").remove([match[1]]);
      }
    } catch {
      // Ignore storage delete errors for external URLs
    }
    onChange(images.filter((_, i) => i !== index));
  }, [images, onChange]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    onChange(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Photos ({images.length}/10)</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          disabled={uploading || images.length >= 10}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
          {uploading ? "Upload…" : "Ajouter"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {images.length === 0 ? (
        <div
          className="flex h-28 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleUpload(e.dataTransfer.files); }}
        >
          <div className="text-center">
            <ImagePlus className="mx-auto mb-1 h-6 w-6" />
            <p className="text-xs">Glissez ou cliquez pour ajouter des photos</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all cursor-grab active:cursor-grabbing",
                dragIndex === i && "opacity-40 scale-95",
                dragOverIndex === i && dragIndex !== i && "ring-2 ring-primary",
                i === 0 && "col-span-2 row-span-2"
              )}
            >
              <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Principale
                </span>
              )}
              <div className="absolute inset-0 flex items-start justify-between bg-gradient-to-b from-black/40 via-transparent to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-transform hover:scale-110"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {images.length < 10 && (
            <div
              className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
            >
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
