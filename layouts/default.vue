<template>
    <div class="flex h-screen bg-gray-800 text-gray-100">
        <LayoutTheSidebar />
        <div class="flex-1 flex flex-col overflow-hidden ml-64">
            <LayoutTheHeader />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-4 sm:p-6 lg:p-8">
                <slot />
            </main>
        </div>
    </div>
</template>

<script setup>
</script>

<style>
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
::-webkit-scrollbar-track {
    background: #2d3748;
}
::-webkit-scrollbar-thumb {
    background: #4a5568;
    border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
    background: #718096;
}
</style>
