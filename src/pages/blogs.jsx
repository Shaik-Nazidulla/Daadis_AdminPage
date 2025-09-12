import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAllBlogs,
  createBlogAsync,
  updateBlogAsync,
  deleteBlogAsync,
} from '../redux/slices/blogsSlice';
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '../ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableCell,
} from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import EmailEditor from 'react-email-editor';

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['draft', 'published', 'archived']),
  tags: z.array(z.string()),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featuredImage: z.string().min(1, 'Featured Image URL is required'),
  featuredImageFile: z.any().optional(),
  blogContent: z.object({
    markup: z.string(),
    design: z.any(),
  }),
});

export default function Blogs() {
  const dispatch = useDispatch();
  const { blogs, categories = ['Recipes', 'Health', 'Festivals', 'Stories', 'Tips'], loading, error } = useSelector(state => state.blogs);

  // Table state
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState('');

  // Modal and form state
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);

  // Validate & control entire form
  const form = useForm({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      author: '',
      category: 'Recipes',
      status: 'draft',
      tags: [],
      metaTitle: '',
      metaDescription: '',
      featuredImage: '',
      featuredImageFile: null,
      blogContent: {
        markup: '',
        design: {},
      },
    },
  });

  const [newTag, setNewTag] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const emailEditorRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAllBlogs());
  }, [dispatch]);

  // Filter blogs based on search term
  const filteredBlogs = useMemo(() => {
    if (!searchTerm) return blogs || [];
    return (blogs || []).filter(blog =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [blogs, searchTerm]);

  // Table columns, plain objects (no import of ColumnDef)
  const columns = useMemo(() => [
    {
      accessorKey: 'featuredImage',
      header: 'Image',
      cell: ({ row }) => {
        const url = row.original.featuredImage;
        return url ? (
          <img src={url} alt="blog" className="h-12 w-20 object-cover rounded-lg shadow-sm" />
        ) : (
          <div className="h-12 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-500">No image</span>
          </div>
        );
      },
    },
    { 
      accessorKey: 'title', 
      header: 'Title', 
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="font-semibold text-gray-900 truncate">{row.original.title}</p>
          {row.original.excerpt && (
            <p className="text-sm text-gray-500 truncate mt-1">{row.original.excerpt}</p>
          )}
        </div>
      )
    },
    { accessorKey: 'author', header: 'Author', cell: info => info.getValue() },
    { accessorKey: 'category', header: 'Category', cell: info => info.getValue() },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusClass = status === 'published' ? 'bg-green-100 text-green-800 border-green-200' 
          : status === 'draft' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
          : 'bg-gray-100 text-gray-800 border-gray-200';
        return (
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusClass}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const blog = row.original;
        return (
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(blog)}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(blog._id)} className="text-red-600">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], []);

  // useReactTable instance
  const table = useReactTable({
    data: filteredBlogs,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  function resetForm() {
    form.reset();
    setImagePreview('');
    setNewTag('');
    setEditingBlog(null);
  }

  // Fill form for edit
  function onEdit(blog) {
    setEditingBlog(blog);
    form.reset({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      author: blog.author,
      category: blog.category,
      status: blog.status,
      tags: blog.tags || [],
      metaTitle: blog.metaTitle,
      metaDescription: blog.metaDescription,
      featuredImage: blog.featuredImage,
      blogContent: blog.blogContent || { markup: '', design: {} },
    });
    setImagePreview(blog.featuredImage);
    setShowModal(true);
  }

  // Delete blog handler
  async function onDelete(id) {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await dispatch(deleteBlogAsync(id)).unwrap();
      toast.success('Blog deleted successfully');
      dispatch(fetchAllBlogs());
    } catch (e) {
      toast.error('Failed to delete blog');
    }
  }

  // Image file change handler
  function onImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Image must be JPEG, PNG or WebP');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      form.setValue('featuredImageFile', file);
      form.setValue('featuredImage', '');
      setImagePreview(URL.createObjectURL(file));
    }
  }

  // Add tag
  function addTag() {
    if (!form.getValues('tags')) form.setValue('tags', []);
    if (newTag && !form.getValues('tags').includes(newTag.trim())) {
      form.setValue('tags', [...form.getValues('tags'), newTag.trim()]);
      setNewTag('');
    }
  }

  // Remove tag
  function removeTag(tag) {
    form.setValue('tags', form.getValues('tags').filter(t => t !== tag));
  }

  // Handle form submit (create or update)
  async function onSubmit(data) {
    if (data.featuredImageFile) {
      try {
        const uploadData = new FormData();
        uploadData.append('blogCover', data.featuredImageFile);

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${import.meta.env.VITE_PORT}${import.meta.env.VITE_API_URL}media/upload`, {
          method: 'POST',
          credentials: 'include',
          body: uploadData
        });
        const result = await res.json();

        if (!res.ok) throw new Error(result.message || 'Upload failed');

        data.featuredImage = result.data.url;
        data.blogContent = data.blogContent || { markup: '', design: {} };
        data.blogContent.design = data.blogContent.design || {};
        data.blogContent.markup = data.content;

      } catch (e) {
        toast.error('Image upload failed: ' + e.message);
        return;
      }
    }

    if (!data.featuredImage || (!data.featuredImage.startsWith('http://') && !data.featuredImage.startsWith('https://'))) {
      toast.error('Valid featured image URL is required');
      return;
    }

    try {
      if (editingBlog) {
        await dispatch(updateBlogAsync({ id: editingBlog._id, updates: data })).unwrap();
        toast.success('Blog updated successfully');
      } else {
        await dispatch(createBlogAsync(data)).unwrap();
        toast.success('Blog created successfully');
      }
      setShowModal(false);
      dispatch(fetchAllBlogs());
      resetForm();
    } catch (e) {
      toast.error('Failed to save blog: ' + (e.message || 'Unknown error'));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Blogs</h1>
              <p className="text-gray-600 mt-1">Create and manage your blog posts</p>
            </div>
            <Button 
              onClick={() => { resetForm(); setShowModal(true) }} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              New Blog
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search blogs</Label>
              <input
                id="search"
                type="text"
                placeholder="Search blogs by title, author, or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <EyeIcon className="h-4 w-4" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                {table
                  .getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="bg-gray-50">
                  {headerGroup.headers.map(header => (
                    <TableCell key={header.id} className="font-semibold text-gray-900 py-4">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-12 text-gray-500">
                    {searchTerm ? 'No blogs found matching your search.' : 'No blogs found. Create your first blog post!'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredBlogs.length)} of{' '}
              {filteredBlogs.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => table.previousPage()} 
                disabled={!table.getCanPreviousPage()}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button 
                onClick={() => table.nextPage()} 
                disabled={!table.getCanNextPage()}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingBlog ? 'Edit Blog' : 'Create New Blog'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details below to {editingBlog ? 'update' : 'create'} your blog post
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">
                    Blog Title *
                  </Label>
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <Input 
                          {...field} 
                          id="title"
                          placeholder="Enter blog title" 
                          className={fieldState.error ? 'border-red-500' : ''}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="author" className="text-sm font-medium text-gray-700 mb-2 block">
                    Author *
                  </Label>
                  <Controller
                    name="author"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div>
                        <Input 
                          {...field} 
                          id="author"
                          placeholder="Author name" 
                          className={fieldState.error ? 'border-red-500' : ''}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt" className="text-sm font-medium text-gray-700 mb-2 block">
                  Excerpt
                </Label>
                <Controller
                  name="excerpt"
                  control={form.control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      id="excerpt"
                      placeholder="Brief description of the blog post" 
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2 block">
                    Category *
                  </Label>
                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field }) => (
                      <select 
                        {...field} 
                        id="category"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2 block">
                    Status *
                  </Label>
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field }) => (
                      <select 
                        {...field} 
                        id="status"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Tags</Label>
                <div className="flex gap-2 mb-3">
                  <input 
                    value={newTag} 
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Add a tag" 
                  />
                  <Button 
                    type="button" 
                    onClick={addTag}
                    variant="outline"
                    disabled={!newTag.trim()}
                  >
                    Add Tag
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.getValues('tags') || []).map(tag => (
                    <span 
                      key={tag} 
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition-colors flex items-center gap-1" 
                      onClick={() => removeTag(tag)}
                    >
                      {tag} 
                      <span className="ml-1 hover:text-blue-600">&times;</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Featured Image *</Label>
                <Controller
                  name="featuredImage"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Input 
                        {...field} 
                        placeholder="Image URL (http:// or https://)" 
                        className={fieldState.error ? 'border-red-500' : ''}
                      />
                      {fieldState.error && (
                        <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />
                <div className="mt-3">
                  <Label htmlFor="imageFile" className="text-sm text-gray-600 mb-2 block">
                    Or upload an image file:
                  </Label>
                  <input 
                    id="imageFile"
                    type="file" 
                    accept="image/*" 
                    onChange={onImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {imagePreview && (
                  <div className="mt-3">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-48 w-auto rounded-lg border border-gray-300" 
                    />
                  </div>
                )}
              </div>

              {/* Content - EmailEditor */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Blog Content *</Label>
                <Controller
                  name="blogContent"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <EmailEditor
                          ref={emailEditorRef}
                          onReady={(editor) => {
                            if (editingBlog?.blogContent?.design) {
                              editor.loadDesign(editingBlog.blogContent.design);
                            }
                          }}
                          onLoad={() => {
                            if (emailEditorRef.current?.editor && editingBlog?.blogContent?.design) {
                              emailEditorRef.current.editor.loadDesign(editingBlog.blogContent.design);
                            }
                          }}
                          minHeight={400}
                          options={{
                            displayMode: 'email',
                            locale: 'en-US',
                            tools: {
                              form: { enabled: false }
                            }
                          }}
                        />
                      </div>
                      {fieldState.error && (
                        <p className="text-red-500 text-sm mt-1">Content is required</p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* SEO Meta Fields */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900">SEO Settings (Optional)</h3>
                
                <div>
                  <Label htmlFor="metaTitle" className="text-sm font-medium text-gray-700 mb-2 block">
                    Meta Title
                  </Label>
                  <Controller
                    name="metaTitle"
                    control={form.control}
                    render={({ field }) => (
                      <Input 
                        {...field} 
                        id="metaTitle"
                        placeholder="SEO Meta Title" 
                      />
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="metaDescription" className="text-sm font-medium text-gray-700 mb-2 block">
                    Meta Description
                  </Label>
                  <Controller
                    name="metaDescription"
                    control={form.control}
                    render={({ field }) => (
                      <textarea 
                        {...field} 
                        id="metaDescription"
                        rows={3} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        placeholder="SEO Meta Description" 
                      />
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? 'Saving...' : editingBlog ? "Update Blog" : "Create Blog"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}