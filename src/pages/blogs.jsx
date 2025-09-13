import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAllBlogs,
  createBlogAsync,
  updateBlogAsync,
  deleteBlogAsync,
} from '../redux/slices/blogsSlice';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import EmailEditor from 'react-email-editor';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../ui/table';
import {
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import { flexRender, useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  featuredImage: z.string().optional(),
  featuredImageFile: z.any().optional(),
  blogContent: z.object({
    design: z.any(),
    markup: z.string(),
  }),
});

export default function Blogs() {
  const dispatch = useDispatch();
  const { blogs, loading, error } = useSelector((state) => state.blogs);

  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);

  const form = useForm({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: '',
      featuredImage: '',
      featuredImageFile: null,
      blogContent: { design: {}, markup: '' },
    },
  });

  const emailEditorRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAllBlogs());
  }, [dispatch]);

  // Load existing blog into form for editing
  const startEditBlog = (blog) => {
    console.log('Starting edit for blog:', blog);
    setEditingBlog(blog);

    form.reset({
      title: blog.title,
      featuredImage: blog.blogImgUrl?.url || '',
      featuredImageFile: null,
      blogContent: blog.blogContent || { design: {}, markup: '' },
    });

    setImagePreview(blog.blogImgUrl?.url || '');
    setFileToUpload(null);

    setShowModal(true);
    
    // Load design JSON in editor after a slight delay to ensure editor is ready
    setTimeout(() => {
      if (emailEditorRef.current && blog.blogContent?.design) {
        console.log('Loading design into editor:', blog.blogContent.design);
        emailEditorRef.current.editor.loadDesign(blog.blogContent.design);
      }
    }, 500);
  };

  // Table Setup - Fixed getPaginationRowModel
  const columns = useMemo(
    () => [
      { 
        accessorKey: 'title', 
        header: 'Title',
        cell: ({ row }) => (
          <div className="max-w-xs truncate">
            {row.getValue('title')}
          </div>
        )
      },
      { 
        accessorKey: 'createdAt', 
        header: 'Created',
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt'));
          return date.toLocaleDateString();
        }
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <PlusIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => startEditBlog(row.original)}>
                <PencilIcon className="mr-2 w-4 h-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={() => {
                  if (confirm('Are you sure you want to delete this blog?')) {
                    dispatch(deleteBlogAsync(row.original._id || row.original.id));
                  }
                }}
              >
                <TrashIcon className="mr-2 w-4 h-4 text-red-500" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [dispatch]
  );

  const table = useReactTable({
    data: blogs || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // Fixed typo
  });

  // Submit handler for both create and update
  const onSubmit = async (values) => {
    console.log('Form submitted with values:', values);
    console.log('Editing blog:', editingBlog);
    
    try {
      // Export HTML/design from EmailEditor
      const exportData = await new Promise((resolve, reject) => {
        if (!emailEditorRef.current) {
          reject(new Error('Email editor not ready'));
          return;
        }
        
        emailEditorRef.current.editor.exportHtml((data) => {
          console.log('Exported editor data:', data);
          resolve(data);
        });
      });

      const { design, html } = exportData;

      // Build FormData payload with required fields
      const formData = new FormData();
      formData.append('blogName', values.title);
      formData.append('title', values.title);
      formData.append('designData', JSON.stringify(design));
      formData.append('markup', html);

      // Handle image file upload
      if (fileToUpload) {
        console.log('Adding new image file:', fileToUpload.name);
        formData.append('blogImage', fileToUpload);
      } else if (imagePreview && !editingBlog) {
        // For create: require image
        throw new Error('Please upload a banner image');
      }
      // For edit: if no new file but has preview, keep existing image (don't append anything)

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      if (editingBlog) {
        console.log('Updating blog with ID:', editingBlog._id || editingBlog.id);
        // Update blog
        const result = await dispatch(updateBlogAsync({ 
          id: editingBlog._id || editingBlog.id, 
          updates: formData 
        })).unwrap();
        console.log('Update result:', result);
        toast.success('Blog updated successfully');
      } else {
        console.log('Creating new blog');
        // Create blog
        const result = await dispatch(createBlogAsync({ formData })).unwrap();
        console.log('Create result:', result);
        toast.success('Blog created successfully');
      }

      // Reset form and close modal
      form.reset();
      setImagePreview('');
      setFileToUpload(null);
      setEditingBlog(null);
      setShowModal(false);
      
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to save blog');
    }
  };

  // Handle image selection
  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Image selected:', file.name);
      setFileToUpload(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      form.setValue('featuredImage', previewUrl);
      form.setValue('featuredImageFile', file);
    }
  };

  const resetModal = () => {
    setEditingBlog(null);
    form.reset({
      title: '',
      featuredImage: '',
      featuredImageFile: null,
      blogContent: { design: {}, markup: '' },
    });
    setImagePreview('');
    setFileToUpload(null);
    
    // Clear the email editor
    if (emailEditorRef.current) {
      emailEditorRef.current.editor.loadDesign({});
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blogs</h1>
        <Button 
          onClick={() => {
            resetModal();
            setShowModal(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" /> New Blog
        </Button>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">Loading blogs...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableCell key={header.id} className="font-medium">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No blogs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogTrigger hidden />
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBlog ? 'Edit Blog' : 'Create Blog'}
            </DialogTitle>
            <DialogDescription>
              {editingBlog ? 'Update your blog details below' : 'Enter blog details below'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field */}
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title" 
                    {...field} 
                    placeholder="Enter blog title"
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Image Upload Field */}
            <div>
              <Label htmlFor="featuredImage">
                Banner Image {!editingBlog && '*'}
              </Label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={onImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Banner Preview" 
                    className="h-32 w-48 object-cover border rounded"
                  />
                </div>
              )}
            </div>

            {/* Content Editor */}
            <div>
              <Label>Content *</Label>
              <div className="border rounded">
                <EmailEditor
                  ref={emailEditorRef}
                  onLoad={() => {
                    console.log('EmailEditor loaded');
                    // If editing, load the design after editor loads
                    if (editingBlog?.blogContent?.design) {
                      setTimeout(() => {
                        emailEditorRef.current?.editor.loadDesign(editingBlog.blogContent.design);
                      }, 100);
                    }
                  }}
                  minHeight={400}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  resetModal();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingBlog ? 'Update Blog' : 'Create Blog')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}