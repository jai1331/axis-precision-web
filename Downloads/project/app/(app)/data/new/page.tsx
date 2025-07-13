import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Add New Entry</h1>
      <ProductForm />
    </div>
  );
}